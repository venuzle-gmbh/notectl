/**
 * SuperSubPlugin: registers superscript and subscript inline marks with
 * MarkSpecs, toggle commands, keyboard shortcuts, toolbar buttons, and
 * a middleware that enforces mutual exclusivity between the two marks.
 *
 * Data-driven — each mark type is defined declaratively and all
 * registrations are derived from the same definition table.
 */

import { isMarkActive, toggleMark } from '../../commands/Commands.js';
import type { Mark } from '../../model/Document.js';
import type { ParseRule } from '../../model/ParseRule.js';
import type { SanitizeConfig } from '../../model/SanitizeConfig.js';
import { markType as mkType } from '../../model/TypeBrands.js';
import type { RemoveMarkStep, Step } from '../../state/Transaction.js';
import type { Plugin, PluginContext } from '../Plugin.js';
import { dispatchIfPresent, resolveLocale, toCommandName } from '../shared/PluginHelpers.js';
import { formatShortcut } from '../shared/ShortcutFormatting.js';
import { SUPER_SUB_LOCALE_EN, type SuperSubLocale, loadSuperSubLocale } from './SuperSubLocale.js';

// --- Attribute Registry Augmentation ---

declare module '../../model/AttrRegistry.js' {
	interface MarkAttrRegistry {
		superscript: Record<string, never>;
		subscript: Record<string, never>;
	}
}

// --- Configuration ---

/** Controls toolbar button visibility per mark. */
export interface SuperSubToolbarConfig {
	readonly superscript?: boolean;
	readonly subscript?: boolean;
}

/** Controls which marks are enabled and which toolbar buttons are shown. */
export interface SuperSubConfig {
	readonly superscript: boolean;
	readonly subscript: boolean;
	readonly toolbar?: SuperSubToolbarConfig;
	readonly locale?: SuperSubLocale;
}

const DEFAULT_CONFIG: SuperSubConfig = {
	superscript: true,
	subscript: true,
};

// --- Mark Definitions ---

interface MarkDefinition {
	readonly type: 'superscript' | 'subscript';
	readonly opposite: 'superscript' | 'subscript';
	readonly configKey: keyof Omit<SuperSubConfig, 'toolbar' | 'locale'>;
	readonly rank: number;
	readonly tag: string;
	readonly icon: string;
	readonly keyBinding: string;
	readonly toHTMLString: (content: string) => string;
	readonly parseHTML: readonly ParseRule[];
	readonly sanitize: SanitizeConfig;
}

const SUPERSCRIPT_ICON: string =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M252,144a12,12,0,0,1-12,12H192a12,12,0,0,1-9.6-19.2l43.17-57.55A12,12,0,1,0,204.68,68a12,12,0,0,1-22.63-8,36.24,36.24,0,0,1,5.2-9.66,36,36,0,0,1,57.5,43.33L216,132h24A12,12,0,0,1,252,144ZM151.86,70.94a12,12,0,0,0-16.93,1.2L92,121.68,49.07,72.14A12,12,0,0,0,30.93,87.86L76.12,140,30.93,192.14a12,12,0,0,0,18.14,15.72L92,158.32l42.93,49.54a12,12,0,1,0,18.14-15.72L107.88,140l45.19-52.14A12,12,0,0,0,151.86,70.94Z"></path></svg>';

const SUBSCRIPT_ICON: string =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor"><path d="M252,208a12,12,0,0,1-12,12H192a12,12,0,0,1-9.6-19.2l43.17-57.56a12,12,0,0,0-2.35-16.82A12,12,0,0,0,204.68,132a12,12,0,0,1-22.63-8,36.3,36.3,0,0,1,5.2-9.67,36,36,0,0,1,57.5,43.34L216,196h24A12,12,0,0,1,252,208ZM151.86,46.93a12,12,0,0,0-16.93,1.21L92,97.68,49.07,48.14A12,12,0,0,0,30.93,63.86L76.12,116,30.93,168.14a12,12,0,0,0,18.14,15.72L92,134.32l42.93,49.54a12,12,0,1,0,18.14-15.72L107.88,116l45.19-52.14A12,12,0,0,0,151.86,46.93Z"></path></svg>';

const MARK_DEFINITIONS: readonly MarkDefinition[] = [
	{
		type: 'superscript',
		opposite: 'subscript',
		configKey: 'superscript',
		rank: 4,
		tag: 'sup',
		icon: SUPERSCRIPT_ICON,
		keyBinding: 'Mod-.',
		toHTMLString: (content) => `<sup>${content}</sup>`,
		parseHTML: [{ tag: 'sup' }],
		sanitize: { tags: ['sup'] },
	},
	{
		type: 'subscript',
		opposite: 'superscript',
		configKey: 'subscript',
		rank: 4,
		tag: 'sub',
		icon: SUBSCRIPT_ICON,
		keyBinding: 'Mod-,',
		toHTMLString: (content) => `<sub>${content}</sub>`,
		parseHTML: [{ tag: 'sub' }],
		sanitize: { tags: ['sub'] },
	},
];

// --- Plugin ---

export class SuperSubPlugin implements Plugin {
	readonly id = 'super-sub';
	readonly name = 'Superscript & Subscript';
	readonly priority = 23;

	private readonly config: SuperSubConfig;
	private locale!: SuperSubLocale;

	constructor(config?: Partial<SuperSubConfig>) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	async init(context: PluginContext): Promise<void> {
		this.locale = await resolveLocale(
			context,
			this.config.locale,
			SUPER_SUB_LOCALE_EN,
			loadSuperSubLocale,
		);

		const enabledMarks: MarkDefinition[] = MARK_DEFINITIONS.filter(
			(def) => this.config[def.configKey],
		);

		for (const def of enabledMarks) {
			this.registerMark(context, def);
		}

		this.registerKeymaps(context, enabledMarks);
		this.registerExclusivityMiddleware(context, enabledMarks);
		this.registerDisabledToolbarItems(context);
	}

	private registerMark(context: PluginContext, def: MarkDefinition): void {
		const commandName: string = toCommandName(def.type);
		const toolbarVisible: boolean = this.isToolbarVisible(def.configKey);

		context.registerMarkSpec({
			type: def.type,
			rank: def.rank,
			toDOM() {
				return document.createElement(def.tag);
			},
			toHTMLString: (_mark, content) => def.toHTMLString(content),
			parseHTML: def.parseHTML,
			sanitize: def.sanitize,
		});

		context.registerCommand(commandName, () =>
			dispatchIfPresent(context, toggleMark(context.getState(), mkType(def.type))),
		);

		if (toolbarVisible) {
			const label: string =
				def.type === 'superscript' ? this.locale.superscriptLabel : this.locale.subscriptLabel;
			const tooltip: string =
				def.type === 'superscript'
					? this.locale.superscriptTooltip(formatShortcut(def.keyBinding))
					: this.locale.subscriptTooltip(formatShortcut(def.keyBinding));
			context.registerToolbarItem({
				id: def.type,
				group: 'format',
				icon: def.icon,
				label,
				tooltip,
				command: commandName,
				isActive: (state) => isMarkActive(state, mkType(def.type)),
			});
		}
	}

	private registerKeymaps(context: PluginContext, marks: readonly MarkDefinition[]): void {
		const keymap: Record<string, () => boolean> = {};
		for (const def of marks) {
			const commandName: string = toCommandName(def.type);
			keymap[def.keyBinding] = () => context.executeCommand(commandName);
		}
		if (Object.keys(keymap).length > 0) {
			context.registerKeymap(keymap);
		}
	}

	/**
	 * Ensures superscript and subscript are mutually exclusive.
	 * When an addMark step for one type is found, a removeMark step
	 * for the opposite type is injected. For stored marks, the opposite
	 * mark is filtered out.
	 */
	private registerExclusivityMiddleware(
		context: PluginContext,
		enabledMarks: readonly MarkDefinition[],
	): void {
		const bothEnabled: boolean =
			enabledMarks.some((d) => d.type === 'superscript') &&
			enabledMarks.some((d) => d.type === 'subscript');

		if (!bothEnabled) return;

		context.registerMiddleware(
			(tr, _state, next) => {
				let patched = false;

				// Handle addMark steps: inject removeMark for the opposite type
				const patchedSteps: Step[] = [];
				for (const step of tr.steps) {
					if (step.type !== 'addMark') {
						patchedSteps.push(step);
						continue;
					}

					const markName: string = step.mark.type;
					const def: MarkDefinition | undefined = MARK_DEFINITIONS.find((d) => d.type === markName);
					if (!def) {
						patchedSteps.push(step);
						continue;
					}

					patched = true;
					const removeStep: RemoveMarkStep = {
						type: 'removeMark',
						blockId: step.blockId,
						from: step.from,
						to: step.to,
						mark: { type: mkType(def.opposite) },
						...(step.path ? { path: step.path } : {}),
					};
					patchedSteps.push(removeStep, step);
				}

				// Handle stored marks: remove the opposite mark
				let storedMarksAfter: readonly Mark[] | null = tr.storedMarksAfter;
				if (storedMarksAfter) {
					const hasSup: boolean = storedMarksAfter.some((m) => m.type === 'superscript');
					const hasSub: boolean = storedMarksAfter.some((m) => m.type === 'subscript');

					if (hasSup && hasSub) {
						// Keep the one that was most recently added (last in array)
						const lastSupIdx: number = storedMarksAfter.findLastIndex(
							(m) => m.type === 'superscript',
						);
						const lastSubIdx: number = storedMarksAfter.findLastIndex(
							(m) => m.type === 'subscript',
						);
						const removeType: string = lastSupIdx > lastSubIdx ? 'subscript' : 'superscript';

						storedMarksAfter = storedMarksAfter.filter((m) => m.type !== removeType);
						patched = true;
					}
				}

				next(patched ? { ...tr, steps: patchedSteps, storedMarksAfter } : tr);
			},
			{ name: 'super-sub:exclusivity' },
		);
	}

	/**
	 * Registers disabled toolbar buttons for marks whose feature is disabled
	 * but whose toolbar button is explicitly requested.
	 */
	private registerDisabledToolbarItems(context: PluginContext): void {
		if (!this.config.toolbar) return;

		for (const def of MARK_DEFINITIONS) {
			const featureEnabled: boolean = this.config[def.configKey];
			const toolbarVisible: boolean = this.config.toolbar[def.configKey] ?? true;

			if (!featureEnabled && toolbarVisible) {
				const label: string =
					def.type === 'superscript' ? this.locale.superscriptLabel : this.locale.subscriptLabel;
				context.registerToolbarItem({
					id: def.type,
					group: 'format',
					icon: def.icon,
					label,
					command: toCommandName(def.type),
					isEnabled: () => false,
				});
			}
		}
	}

	private isToolbarVisible(configKey: keyof Omit<SuperSubConfig, 'toolbar' | 'locale'>): boolean {
		if (!this.config.toolbar) return true;
		return this.config.toolbar[configKey] ?? true;
	}
}
