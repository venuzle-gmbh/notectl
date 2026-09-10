/**
 * PrintPlugin: provides print functionality for the notectl editor.
 * Registers a command, keymap, toolbar item, and exposes a PrintService.
 * Orchestrator only — delegates all logic to PrintServiceImpl, PrintStyleCollector,
 * and PrintContentPreparer.
 */

import type { Plugin, PluginContext } from '../Plugin.js';
import { resolveLocale } from '../shared/PluginHelpers.js';
import { formatShortcut } from '../shared/ShortcutFormatting.js';
import { PRINT_LOCALE_EN, type PrintLocale, loadPrintLocale } from './PrintLocale.js';
import { type ManagedPrintService, createPrintService } from './PrintServiceImpl.js';
import type { PrintOptions, PrintPluginConfig, PrintService } from './PrintTypes.js';
import { PRINT_SERVICE_KEY } from './PrintTypes.js';

const PRINT_ICON: string =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4"><path fill-rule="evenodd" d="M4 5a2 2 0 0 0-2 2v3a2 2 0 0 0 1.51 1.94l-.315 1.896A1 1 0 0 0 4.18 15h7.639a1 1 0 0 0 .986-1.164l-.316-1.897A2 2 0 0 0 14 10V7a2 2 0 0 0-2-2V2a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v3Zm1.5 0V2.5h5V5h-5Zm5.23 5.5H5.27l-.5 3h6.459l-.5-3Z" clip-rule="evenodd" /></svg>';

/** No-op fallback service for environments without ShadowRoot. */
const NOOP_SERVICE: ManagedPrintService = {
	print(): void {},
	toHTML(): string {
		return '';
	},
	dispose(): void {},
};

export class PrintPlugin implements Plugin {
	readonly id = 'print';
	readonly name = 'Print';

	private readonly config: PrintPluginConfig;
	private service: ManagedPrintService | null = null;
	private locale!: PrintLocale;

	constructor(config?: PrintPluginConfig) {
		this.config = config ?? {};
	}

	async init(context: PluginContext): Promise<void> {
		this.locale = await resolveLocale(
			context,
			this.config.locale,
			PRINT_LOCALE_EN,
			loadPrintLocale,
		);
		const container: HTMLElement = context.getContainer();
		const rootNode: Node = container.getRootNode();

		if (rootNode instanceof ShadowRoot) {
			const host: HTMLElement = rootNode.host as HTMLElement;
			const eventBus = context.getEventBus();
			this.service = createPrintService(rootNode, host, container, eventBus);
		} else {
			this.service = NOOP_SERVICE;
		}

		context.registerService(PRINT_SERVICE_KEY, this.service);

		const defaults: PrintOptions = this.config.defaults ?? {};
		const service: PrintService = this.service;

		const printLocale = this.locale;
		context.registerCommand('print', () => {
			context.announce(printLocale.printingAnnouncement);
			service.print(defaults);
			return true;
		});

		const keyBinding: string = this.config.keyBinding ?? 'Mod-P';
		context.registerKeymap({
			[keyBinding]: () => {
				context.executeCommand('print');
				return true;
			},
		});

		if (this.config.showToolbarItem !== false) {
			const shortcut: string = formatShortcut(keyBinding);
			context.registerToolbarItem({
				id: 'print',
				group: 'actions',
				label: this.locale.label,
				tooltip: this.locale.tooltip(shortcut),
				icon: PRINT_ICON,
				command: 'print',
			});
		}
	}

	destroy(): void {
		// A print still waiting on its iframe's load event must not pop the
		// dialog after the editor is gone (e.g. after an SPA navigation).
		this.service?.dispose();
		this.service = null;
	}
}
