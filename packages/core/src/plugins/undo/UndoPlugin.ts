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
			icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4"><path fill-rule="evenodd" d="M12.5 9.75A2.75 2.75 0 0 0 9.75 7H4.56l2.22 2.22a.75.75 0 1 1-1.06 1.06l-3.5-3.5a.75.75 0 0 1 0-1.06l3.5-3.5a.75.75 0 0 1 1.06 1.06L4.56 5.5h5.19a4.25 4.25 0 0 1 0 8.5h-1a.75.75 0 0 1 0-1.5h1a2.75 2.75 0 0 0 2.75-2.75Z" clip-rule="evenodd" /></svg>',
			isEnabled: () => {
				return this.view?.history.canUndo() ?? true;
			},
		});
	}
}
