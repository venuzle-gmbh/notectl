/**
 * RedoPlugin: registers a redo button for the toolbar
 * with NodeSpec, insert command, input rule, keyboard shortcut, and toolbar button.
 */

import type { EditorView } from '../../view/EditorView.js';
import type { Plugin, PluginContext } from '../Plugin.js';
import { resolveLocale } from '../shared/PluginHelpers.js';
import { formatShortcut } from '../shared/ShortcutFormatting.js';
import { REDO_LOCALE_EN, type RedoLocale, loadRedoLocale } from './RedoLocale.js';

// --- Configuration ---

export interface RedoConfig {
	/** Locale override for user-facing strings. */
	readonly locale?: RedoLocale;
}

const DEFAULT_CONFIG: RedoConfig = {};

// --- Plugin ---

export class RedoPlugin implements Plugin {
	readonly id = 'redo';
	readonly name = 'Redo';
	readonly priority = 40;

	private readonly config: RedoConfig;
	private locale!: RedoLocale;
	private view!: EditorView | null;

	constructor(config?: Partial<RedoConfig>) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	async init(context: PluginContext): Promise<void> {
		this.locale = await resolveLocale(context, this.config.locale, REDO_LOCALE_EN, loadRedoLocale);
		this.registerCommands(context);
		this.registerToolbarItem(context);
	}

	private registerCommands(context: PluginContext): void {
		context.registerCommand('toolbarRedo', () => {
			if (!this.view) {
				this.view = context.getView();
			}

			if (this.view?.history?.canRedo() ?? false) {
				this.view?.redo();
			}

			return true;
		});
	}

	private registerToolbarItem(context: PluginContext): void {
		context.registerToolbarItem({
			id: 'redo',
			group: 'history',
			label: this.locale.label,
			tooltip: this.locale.tooltip(formatShortcut('Mod-Y')),
			command: 'toolbarRedo',
			icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M396-200q-97 0-166.5-63T160-420q0-94 69.5-157T396-640h252L544-744l56-56 200 200-200 200-56-56 104-104H396q-63 0-109.5 40T240-420q0 60 46.5 100T396-280h284v80H396Z"/></svg>',
			isEnabled: () => {
				return this.view?.history.canRedo() ?? true;
			},
		});
	}
}
