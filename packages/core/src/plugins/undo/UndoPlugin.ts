/**
 * UndoPlugin: registers a undo button for the toolbar
 * with NodeSpec, insert command, input rule, keyboard shortcut, and toolbar button.
 */

import type { EditorView } from '../../view/EditorView.js';
import type { Plugin, PluginContext } from '../Plugin.js';
import { resolveLocale } from '../shared/PluginHelpers.js';
import { formatShortcut } from '../shared/ShortcutFormatting.js';
import { UNDO_LOCALE_EN, type UndoLocale, loadUndoLocale } from './UndoLocale.js';

// --- Configuration ---

export interface UndoConfig {
	/** Locale override for user-facing strings. */
	readonly locale?: UndoLocale;
}

const DEFAULT_CONFIG: UndoConfig = {};

// --- Plugin ---

export class UndoPlugin implements Plugin {
	readonly id = 'undo';
	readonly name = 'Undo';
	readonly priority = 40;

	private readonly config: UndoConfig;
	private locale!: UndoLocale;
	private view!: EditorView | null;

	constructor(config?: Partial<UndoConfig>) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	async init(context: PluginContext): Promise<void> {
		this.locale = await resolveLocale(context, this.config.locale, UNDO_LOCALE_EN, loadUndoLocale);
		this.registerCommands(context);
		this.registerToolbarItem(context);
	}

	private registerCommands(context: PluginContext): void {
		context.registerCommand('toolbarUndo', () => {
			if (!this.view) {
				this.view = context.getView();
			}

			if (this.view?.history?.canUndo() ?? false) {
				this.view?.undo();
			}

			return true;
		});
	}

	private registerToolbarItem(context: PluginContext): void {
		context.registerToolbarItem({
			id: 'undo',
			group: 'history',
			label: this.locale.label,
			tooltip: this.locale.tooltip(formatShortcut('Mod-Z')),
			command: 'toolbarUndo',
			icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M280-200v-80h284q63 0 109.5-40T720-420q0-60-46.5-100T564-560H312l104 104-56 56-200-200 200-200 56 56-104 104h252q97 0 166.5 63T800-420q0 94-69.5 157T564-200H280Z"/></svg>',
			isEnabled: () => {
				return this.view?.history.canUndo() ?? true;
			},
		});
	}
}
