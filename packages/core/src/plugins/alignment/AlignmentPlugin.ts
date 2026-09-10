/**
 * AlignmentPlugin: adds start/center/end/justify alignment as a block
 * attribute on paragraphs, headings, images, and other alignable types.
 * Uses logical values (`start`/`end`) instead of physical (`left`/`right`)
 * for correct behavior with RTL text direction. Patches NodeSpecs to render
 * the `align` attribute via inline `text-align` style and provides toggle
 * commands, keyboard shortcuts, and a toolbar dropdown.
 */

import type { BlockAlignment } from '../../model/BlockAlignment.js';
import type { BlockNode } from '../../model/Document.js';
import type { BlockId } from '../../model/TypeBrands.js';
import type { EditorState } from '../../state/EditorState.js';
import { setStyleProperty } from '../../style/StyleRuntime.js';
import type { Plugin, PluginContext } from '../Plugin.js';
import { patchNodeSpecAttr } from '../shared/NodeSpecPatching.js';
import {
	capitalize,
	dispatchIfPresent,
	getSelectedBlock,
	getSelectedBlockIds,
	resolveLocale,
} from '../shared/PluginHelpers.js';
import {
	ALIGNMENT_LOCALE_EN,
	type AlignmentLocale,
	loadAlignmentLocale,
} from './AlignmentLocale.js';

// --- Public Types ---

export interface AlignmentConfig {
	/** Which alignments to expose. Defaults to all four. */
	readonly alignments: readonly BlockAlignment[];
	/** Block types that support alignment. Defaults to paragraph + heading + title + subtitle + table_cell + image. */
	readonly alignableTypes: readonly string[];
	/** Per-type default alignment (e.g. `{ image: 'center' }`). Falls back to `'start'`. */
	readonly defaults: Readonly<Record<string, BlockAlignment>>;
	readonly locale?: AlignmentLocale;
}

// --- Constants ---

const DEFAULT_CONFIG: AlignmentConfig = {
	alignments: ['start', 'center', 'end', 'justify'],
	alignableTypes: ['paragraph', 'heading', 'title', 'subtitle', 'table_cell', 'image'],
	defaults: { image: 'center' },
};

export const ALIGNMENT_ICONS: Readonly<Record<BlockAlignment, string>> = {
	start:
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4"><path fill-rule="evenodd" d="M2 3.75A.75.75 0 0 1 2.75 3h10.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 3.75ZM2 8a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 8Zm0 4.25a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75Z" clip-rule="evenodd" /></svg>',
	center:
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4" id="svg1"> <defs id="defs1" /> <path fill-rule="evenodd" d="M 2,3.75 C 2,3.3357864 2.3357864,3 2.75,3 h 10.5 c 1,0 1,1.5 0,1.5 H 2.75 C 2.3357864,4.5 2,4.1642136 2,3.75 Z m 0,8.5 C 2,11.835786 2.3357864,11.5 2.75,11.5 h 10.5 c 1,0 1,1.5 0,1.5 H 2.75 C 2.3357864,13 2,12.664214 2,12.25 Z" clip-rule="evenodd" id="path1" /> <path d="m 4.9999999,8 c 0,-0.4142136 0.335786,-0.75 0.75,-0.75 H 10.25 c 1,0 1,1.5 0,1.5 H 5.7499999 c -0.414214,0 -0.75,-0.3357864 -0.75,-0.75 z" style="clip-rule:evenodd;fill-rule:evenodd" id="path1-5" /> </svg>',
	end: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4"><path fill-rule="evenodd" d="M2 3.75A.75.75 0 0 1 2.75 3h10.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 3.75ZM2 8a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 8Zm6 4.25a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75Z" clip-rule="evenodd" /></svg>',
	justify:
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4"><path fill-rule="evenodd" d="M2 2.75A.75.75 0 0 1 2.75 2h10.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 2.75Zm0 10.5a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75ZM2 6.25a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 6.25Zm0 3.5A.75.75 0 0 1 2.75 9h10.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 9.75Z" clip-rule="evenodd" /></svg>',
};

// --- Plugin ---

export class AlignmentPlugin implements Plugin {
	readonly id = 'alignment';
	readonly name = 'Alignment';
	readonly priority = 90;

	private readonly config: AlignmentConfig;
	private locale!: AlignmentLocale;
	private alignableTypes!: ReadonlySet<string>;

	constructor(config?: Partial<AlignmentConfig>) {
		this.config = {
			...DEFAULT_CONFIG,
			...config,
			defaults: { ...DEFAULT_CONFIG.defaults, ...config?.defaults },
		};
	}

	async init(context: PluginContext): Promise<void> {
		this.locale = await resolveLocale(
			context,
			this.config.locale,
			ALIGNMENT_LOCALE_EN,
			loadAlignmentLocale,
		);

		this.alignableTypes = new Set(this.config.alignableTypes);
		this.patchNodeSpecs(context);
		this.registerCommands(context);
		this.registerKeymaps(context);
		this.registerToolbarItem(context);
		this.registerMiddleware(context);
	}

	// --- NodeSpec Patching ---

	/**
	 * Patches existing NodeSpecs for alignable block types to support the
	 * `align` attribute and render it as an inline style. Skips types
	 * that already define an `align` attribute in their spec.
	 */
	private patchNodeSpecs(context: PluginContext): void {
		patchNodeSpecAttr(context, this.config.alignableTypes, {
			attrName: 'align',
			getDefault: (type) => this.config.defaults[type] ?? 'start',
			applyToDOM: applyAlignment,
		});
	}

	// --- Commands ---

	private registerCommands(context: PluginContext): void {
		for (const alignment of this.config.alignments) {
			context.registerCommand(`align${capitalize(alignment)}`, () => {
				return this.setAlignment(context, alignment);
			});
		}
	}

	// --- Keymaps ---

	private registerKeymaps(context: PluginContext): void {
		const bindings: Record<string, () => boolean> = {};

		if (this.config.alignments.includes('start')) {
			bindings['Mod-Shift-L'] = () => context.executeCommand('alignStart');
		}
		if (this.config.alignments.includes('center')) {
			bindings['Mod-Shift-E'] = () => context.executeCommand('alignCenter');
		}
		if (this.config.alignments.includes('end')) {
			bindings['Mod-Shift-R'] = () => context.executeCommand('alignEnd');
		}
		if (this.config.alignments.includes('justify')) {
			bindings['Mod-Shift-J'] = () => context.executeCommand('alignJustify');
		}

		if (Object.keys(bindings).length > 0) {
			context.registerKeymap(bindings);
		}
	}

	// --- Toolbar ---

	private registerToolbarItem(context: PluginContext): void {
		const dropdownItems = this.config.alignments.map((alignment) => ({
			label: this.getAlignmentLabel(alignment),
			command: `align${capitalize(alignment)}`,
			icon: ALIGNMENT_ICONS[alignment],
		}));

		context.registerToolbarItem({
			id: 'alignment',
			group: 'block',
			icon: ALIGNMENT_ICONS.start,
			label: this.locale.toolbarLabel,
			tooltip: this.locale.toolbarTooltip,
			command: 'alignStart',
			popupType: 'dropdown',
			popupConfig: { items: dropdownItems },
			isActive: (state) => this.isNonDefaultAlignment(state),
			isEnabled: (state) => this.isAlignable(state),
		});
	}

	private getAlignmentLabel(alignment: BlockAlignment): string {
		const labels: Record<BlockAlignment, string> = {
			start: this.locale.alignStart,
			center: this.locale.alignCenter,
			end: this.locale.alignEnd,
			justify: this.locale.justify,
		};
		return labels[alignment];
	}

	// --- Middleware ---

	/**
	 * Preserves the `align` attribute when other plugins change the block
	 * type (e.g. paragraph → heading) via `setBlockType`, which replaces attrs.
	 */
	private registerMiddleware(context: PluginContext): void {
		context.registerMiddleware(
			(tr, _state, next) => {
				let patched = false;

				const patchedSteps = tr.steps.map((step) => {
					if (step.type !== 'setBlockType') return step;
					if (!this.alignableTypes.has(step.nodeType)) return step;

					const prevAlign = step.previousAttrs?.align;
					if (!prevAlign || prevAlign === 'start') return step;

					// Carry forward align into new attrs
					patched = true;
					return {
						...step,
						attrs: { ...step.attrs, align: prevAlign },
					};
				});

				next(patched ? { ...tr, steps: patchedSteps } : tr);
			},
			{ name: 'alignment:preserve-align' },
		);
	}

	// --- Alignment Logic ---

	/**
	 * Applies `alignment` to every alignable block in the current selection in
	 * a single transaction. A multi-block selection aligns all of its blocks,
	 * not just the anchor; non-alignable blocks in the range are left untouched.
	 */
	private setAlignment(context: PluginContext, alignment: BlockAlignment): boolean {
		const state = context.getState();
		const blockIds: BlockId[] = getSelectedBlockIds(state);
		if (blockIds.length === 0) return false;

		const tb = state.transaction('command');
		let changed = false;

		for (const id of blockIds) {
			const block = state.getBlock(id);
			if (!block || !this.alignableTypes.has(block.type)) continue;

			const path = state.getNodePath(id);
			if (!path) continue;

			tb.setNodeAttr(path, { ...block.attrs, align: alignment });
			changed = true;
		}

		if (!changed) return false;

		return dispatchIfPresent(context, tb.setSelection(state.selection).build());
	}

	private isNonDefaultAlignment(state: EditorState): boolean {
		const block = getSelectedBlock(state);
		if (!block || !this.alignableTypes.has(block.type)) return false;
		const align = block.attrs?.align;
		const defaultAlign: BlockAlignment = this.config.defaults[block.type] ?? 'start';
		return align != null && align !== defaultAlign;
	}

	private isAlignable(state: EditorState): boolean {
		const block = getSelectedBlock(state);
		return block != null && this.alignableTypes.has(block.type);
	}
}

// --- Helpers ---

function applyAlignment(el: HTMLElement, node: BlockNode): void {
	const align = node.attrs?.align;
	if (typeof align === 'string' && align !== 'start') {
		setStyleProperty(el, 'textAlign', align);
	}
}
