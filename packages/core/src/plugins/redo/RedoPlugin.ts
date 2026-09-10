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
			icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4"><path fill-rule="evenodd" d="M3.5 9.75A2.75 2.75 0 0 1 6.25 7h5.19L9.22 9.22a.75.75 0 1 0 1.06 1.06l3.5-3.5a.75.75 0 0 0 0-1.06l-3.5-3.5a.75.75 0 1 0-1.06 1.06l2.22 2.22H6.25a4.25 4.25 0 0 0 0 8.5h1a.75.75 0 0 0 0-1.5h-1A2.75 2.75 0 0 1 3.5 9.75Z" clip-rule="evenodd" /></svg>',
			isEnabled: () => {
				return this.view?.history.canRedo() ?? true;
			},
		});
	}
}
