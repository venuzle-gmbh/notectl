/**
 * TextFormattingPlugin: registers inline marks (bold, italic, underline)
 * with their MarkSpecs, toggle commands, keyboard shortcuts, and toolbar items.
 *
 * This plugin is data-driven — each mark type is defined declaratively and
 * all registrations (MarkSpec, command, keymap, toolbar item) are derived
 * from the same definition.
 *
 * Supports two separate config dimensions:
 * - Feature config (bold/italic/underline): controls whether the mark is
 *   registered in the schema. When disabled, the keyboard shortcut does nothing.
 * - Toolbar config: controls whether the toolbar button is visible.
 *   When a feature is disabled but toolbar is enabled, the button renders as disabled.
 */

import { isMarkActive, toggleMark } from '../../commands/Commands.js';
import type { ParseRule } from '../../model/ParseRule.js';
import type { SanitizeConfig } from '../../model/SanitizeConfig.js';
import { markType as mkType } from '../../model/TypeBrands.js';
import type { Plugin, PluginContext } from '../Plugin.js';
import { createMarkInputRule } from '../shared/MarkInputRule.js';
import { dispatchIfPresent, resolveLocale, toCommandName } from '../shared/PluginHelpers.js';
import { formatShortcut } from '../shared/ShortcutFormatting.js';
import {
	TEXT_FORMATTING_LOCALE_EN,
	type TextFormattingLocale,
	loadTextFormattingLocale,
} from './TextFormattingLocale.js';

// --- Configuration ---

/** Controls toolbar button visibility per mark. */
export interface TextFormattingToolbarConfig {
	readonly bold?: boolean;
	readonly italic?: boolean;
	readonly underline?: boolean;
}

/** Controls which inline marks are enabled and which toolbar buttons are shown. */
export interface TextFormattingConfig {
	readonly bold: boolean;
	readonly italic: boolean;
	readonly underline: boolean;
	/** Live Markdown shortcuts: `**x**` to bold, `*x*` to italic. Default true. */
	readonly inputRule?: boolean;
	readonly toolbar?: TextFormattingToolbarConfig;
	readonly locale?: TextFormattingLocale;
}

const DEFAULT_CONFIG: TextFormattingConfig = {
	bold: true,
	italic: true,
	underline: true,
};

// --- Mark Definitions ---

interface MarkDefinition {
	readonly type: string;
	readonly configKey: keyof Omit<TextFormattingConfig, 'toolbar' | 'locale' | 'inputRule'>;
	readonly rank: number;
	readonly tag: string;
	readonly icon: string;
	readonly keyBinding: string;
	readonly toHTMLString: (content: string) => string;
	readonly parseHTML: readonly ParseRule[];
	readonly sanitize: SanitizeConfig;
}

const BOLD_ICON =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4"><path fill-rule="evenodd" d="M3 3a1 1 0 0 1 1-1h5a3.5 3.5 0 0 1 2.843 5.541A3.75 3.75 0 0 1 9.25 14H4a1 1 0 0 1-1-1V3Zm2.5 3.5v-2H9a1 1 0 0 1 0 2H5.5Zm0 2.5v2.5h3.75a1.25 1.25 0 1 0 0-2.5H5.5Z" clip-rule="evenodd" /></svg>';
const ITALIC_ICON =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4"><path fill-rule="evenodd" d="M6.25 2.75A.75.75 0 0 1 7 2h6a.75.75 0 0 1 0 1.5h-2.483l-3.429 9H9A.75.75 0 0 1 9 14H3a.75.75 0 0 1 0-1.5h2.483l3.429-9H7a.75.75 0 0 1-.75-.75Z" clip-rule="evenodd" /></svg>';
const UNDERLINE_ICON =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4"><path fill-rule="evenodd" d="M4.75 2a.75.75 0 0 1 .75.75V7a2.5 2.5 0 0 0 5 0V2.75a.75.75 0 0 1 1.5 0V7a4 4 0 0 1-8 0V2.75A.75.75 0 0 1 4.75 2ZM2 13.25a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clip-rule="evenodd" /></svg>';

const MARK_DEFINITIONS: readonly MarkDefinition[] = [
	{
		type: 'bold',
		configKey: 'bold',
		rank: 0,
		tag: 'strong',
		icon: BOLD_ICON,
		keyBinding: 'Mod-B',
		toHTMLString: (content) => `<strong>${content}</strong>`,
		parseHTML: [
			{ tag: 'strong' },
			{
				tag: 'b',
				getAttrs: (el: HTMLElement) => {
					const fw: string = el.style.fontWeight;
					return fw === 'normal' || fw === '400' ? false : {};
				},
			},
			{
				tag: 'span',
				getAttrs: (el: HTMLElement) => {
					const fw: string = el.style.fontWeight;
					if (!fw) return false;
					if (fw === 'bold') return {};
					const numeric: number = Number.parseInt(fw, 10);
					return !Number.isNaN(numeric) && numeric >= 700 ? {} : false;
				},
			},
		],
		sanitize: { tags: ['strong', 'b'] },
	},
	{
		type: 'italic',
		configKey: 'italic',
		rank: 1,
		tag: 'em',
		icon: ITALIC_ICON,
		keyBinding: 'Mod-I',
		toHTMLString: (content) => `<em>${content}</em>`,
		parseHTML: [
			{ tag: 'em' },
			{ tag: 'i' },
			{
				tag: 'span',
				getAttrs: (el: HTMLElement) => {
					return el.style.fontStyle === 'italic' ? {} : false;
				},
			},
		],
		sanitize: { tags: ['em', 'i'] },
	},
	{
		type: 'underline',
		configKey: 'underline',
		rank: 2,
		tag: 'u',
		icon: UNDERLINE_ICON,
		keyBinding: 'Mod-U',
		toHTMLString: (content) => `<u>${content}</u>`,
		parseHTML: [
			{ tag: 'u' },
			{
				tag: 'span',
				getAttrs: (el: HTMLElement) => {
					return el.style.textDecoration.includes('underline') ? {} : false;
				},
			},
		],
		sanitize: { tags: ['u'] },
	},
];

// --- Plugin ---

export class TextFormattingPlugin implements Plugin {
	readonly id = 'text-formatting';
	readonly name = 'Text Formatting';
	readonly priority = 20;

	private readonly config: TextFormattingConfig;
	private locale!: TextFormattingLocale;

	constructor(config?: Partial<TextFormattingConfig>) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	async init(context: PluginContext): Promise<void> {
		this.locale = await resolveLocale(
			context,
			this.config.locale,
			TEXT_FORMATTING_LOCALE_EN,
			loadTextFormattingLocale,
		);

		const enabledMarks = MARK_DEFINITIONS.filter((def) => this.config[def.configKey]);

		for (const def of enabledMarks) {
			this.registerMark(context, def);
		}

		this.registerKeymaps(context, enabledMarks);
		this.registerInputRules(context);

		// Register disabled placeholder buttons for marks that are disabled
		// as features but explicitly requested in the toolbar config
		this.registerDisabledToolbarItems(context);
	}

	private registerMark(context: PluginContext, def: MarkDefinition): void {
		const commandName = toCommandName(def.type);
		const toolbarVisible = this.isToolbarVisible(def.configKey);

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
			const label: string = this.getMarkLabel(def.type);
			context.registerToolbarItem({
				id: def.type,
				group: 'format',
				icon: def.icon,
				label,
				tooltip: `${label} (${formatShortcut(def.keyBinding)})`,
				command: commandName,
				isActive: (state) => isMarkActive(state, mkType(def.type)),
			});
		}
	}

	private registerKeymaps(context: PluginContext, marks: readonly MarkDefinition[]): void {
		const keymap: Record<string, () => boolean> = {};
		for (const def of marks) {
			const commandName = toCommandName(def.type);
			keymap[def.keyBinding] = () => context.executeCommand(commandName);
		}
		if (Object.keys(keymap).length > 0) {
			context.registerKeymap(keymap);
		}
	}

	/**
	 * Registers live Markdown input rules: `**x**` to bold and `*x*` to italic,
	 * each gated on its feature being enabled. Bold is registered first so it
	 * wins over italic when both could match. Underscore variants are left to the
	 * full parser (import/paste) to avoid intra-word `snake_case` false positives.
	 */
	private registerInputRules(context: PluginContext): void {
		if (this.config.inputRule === false) return;
		if (this.config.bold) context.registerInputRule(createMarkInputRule('bold', '**'));
		if (this.config.italic) context.registerInputRule(createMarkInputRule('italic', '*'));
	}

	/**
	 * Registers disabled toolbar buttons for marks whose feature is disabled
	 * but whose toolbar button is explicitly requested.
	 */
	private registerDisabledToolbarItems(context: PluginContext): void {
		if (!this.config.toolbar) return;

		for (const def of MARK_DEFINITIONS) {
			const featureEnabled = this.config[def.configKey];
			const toolbarVisible = this.config.toolbar[def.configKey] ?? true;

			if (!featureEnabled && toolbarVisible) {
				context.registerToolbarItem({
					id: def.type,
					group: 'format',
					icon: def.icon,
					label: this.getMarkLabel(def.type),
					command: toCommandName(def.type),
					isEnabled: () => false,
				});
			}
		}
	}

	private getMarkLabel(type: string): string {
		const key = `${type}Label` as keyof TextFormattingLocale;
		return this.locale[key] as string;
	}

	/** Checks if a toolbar button should be visible for a given mark. */
	private isToolbarVisible(
		configKey: keyof Omit<TextFormattingConfig, 'toolbar' | 'locale' | 'inputRule'>,
	): boolean {
		if (!this.config.toolbar) return true;
		return this.config.toolbar[configKey] ?? true;
	}
}
