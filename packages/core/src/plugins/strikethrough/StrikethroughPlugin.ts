/**
 * StrikethroughPlugin: registers a strikethrough inline mark with MarkSpec,
 * toggle command, keyboard shortcut (Mod-Shift-X), and a toolbar button.
 */

import type { Plugin, PluginContext } from '../Plugin.js';
import { createMarkInputRule } from '../shared/MarkInputRule.js';
import { resolveLocale } from '../shared/PluginHelpers.js';
import { formatShortcut } from '../shared/ShortcutFormatting.js';
import { registerSimpleMark } from '../shared/SimpleMark.js';
import {
	STRIKETHROUGH_LOCALE_EN,
	type StrikethroughLocale,
	loadStrikethroughLocale,
} from './StrikethroughLocale.js';

// --- Attribute Registry Augmentation ---

declare module '../../model/AttrRegistry.js' {
	interface MarkAttrRegistry {
		strikethrough: Record<string, never>;
	}
}

// --- Configuration ---

export interface StrikethroughConfig {
	/** Live Markdown shortcut: `~~x~~` to strikethrough. Default true. */
	readonly inputRule?: boolean;
	readonly locale?: StrikethroughLocale;
}

const DEFAULT_CONFIG: StrikethroughConfig = {};

// --- Plugin ---

export class StrikethroughPlugin implements Plugin {
	readonly id = 'strikethrough';
	readonly name = 'Strikethrough';
	readonly priority = 22;

	private readonly config: StrikethroughConfig;
	private locale!: StrikethroughLocale;

	constructor(config?: Partial<StrikethroughConfig>) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	async init(context: PluginContext): Promise<void> {
		this.locale = await resolveLocale(
			context,
			this.config.locale,
			STRIKETHROUGH_LOCALE_EN,
			loadStrikethroughLocale,
		);
		const icon =
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="size-4"><path fill-rule="evenodd" d="M9.165 3.654c-.95-.255-1.921-.273-2.693-.042-.769.231-1.087.624-1.173.947-.087.323-.008.822.543 1.407.389.412.927.77 1.55 1.034H13a.75.75 0 0 1 0 1.5H3A.75.75 0 0 1 3 7h1.756l-.006-.006c-.787-.835-1.161-1.849-.9-2.823.26-.975 1.092-1.666 2.191-1.995 1.097-.33 2.36-.28 3.512.029.75.2 1.478.518 2.11.939a.75.75 0 0 1-.833 1.248 5.682 5.682 0 0 0-1.665-.738Zm2.074 6.365a.75.75 0 0 1 .91.543 2.44 2.44 0 0 1-.35 2.024c-.405.585-1.052 1.003-1.84 1.24-1.098.329-2.36.279-3.512-.03-1.152-.308-2.27-.897-3.056-1.73a.75.75 0 0 1 1.092-1.029c.552.586 1.403 1.056 2.352 1.31.95.255 1.92.273 2.692.042.55-.165.873-.417 1.038-.656a.942.942 0 0 0 .13-.803.75.75 0 0 1 .544-.91Z" clip-rule="evenodd" /></svg>';

		registerSimpleMark(context, {
			markSpec: {
				type: 'strikethrough',
				rank: 3,
				toDOM() {
					return document.createElement('s');
				},
				toHTMLString: (_mark, content) => `<s>${content}</s>`,
				parseHTML: [
					{ tag: 's' },
					{ tag: 'strike' },
					{ tag: 'del' },
					{
						tag: 'span',
						getAttrs: (el: HTMLElement) => {
							return el.style.textDecoration.includes('line-through') ? {} : false;
						},
					},
				],
				sanitize: { tags: ['s'] },
			},
			command: 'toggleStrikethrough',
			keyBinding: 'Mod-Shift-X',
			toolbar: {
				id: 'strikethrough',
				group: 'format',
				icon,
				label: this.locale.label,
				tooltip: this.locale.tooltip(formatShortcut('Mod-Shift-X')),
			},
		});

		if (this.config.inputRule !== false) {
			context.registerInputRule(createMarkInputRule('strikethrough', '~~'));
		}
	}
}
