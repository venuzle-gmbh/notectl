/**
 * HighlightPlugin: registers a highlight (background-color) mark with attrs,
 * toolbar button with a color picker popup, and removeHighlight command.
 */

import { COLOR_PICKER_CSS } from '../../editor/styles/color-picker.js';
import type { EditorState } from '../../state/EditorState.js';
import type { Plugin, PluginContext } from '../Plugin.js';
import { isColorMarkActive, removeColorMark } from '../shared/ColorMarkOperations.js';
import { renderColorPickerPopup } from '../shared/ColorPickerPopup.js';
import { isValidCSSColor, resolveColors } from '../shared/ColorValidation.js';
import { createInlineStyleMarkSpec } from '../shared/InlineStyleMarkSpec.js';
import { resolveLocale } from '../shared/PluginHelpers.js';
import {
	HIGHLIGHT_LOCALE_EN,
	type HighlightLocale,
	loadHighlightLocale,
} from './HighlightLocale.js';
import { HIGHLIGHT_PALETTE } from './HighlightPalette.js';

// --- Attribute Registry Augmentation ---

declare module '../../model/AttrRegistry.js' {
	interface MarkAttrRegistry {
		highlight: { color: string };
	}
}

// --- Configuration ---

export interface HighlightConfig {
	/**
	 * Restricts the color picker to a specific set of hex colors.
	 * Each value must be a valid hex color code (`#RGB` or `#RRGGBB`).
	 * Duplicates are removed automatically (case-insensitive).
	 * When omitted, the full default palette is shown.
	 */
	readonly colors?: readonly string[];
	readonly locale?: HighlightLocale;
}

// --- Plugin ---

export class HighlightPlugin implements Plugin {
	readonly id = 'highlight';
	readonly name = 'Highlight';
	readonly priority = 24;

	private readonly config: HighlightConfig;
	private readonly colors: readonly string[];
	private locale!: HighlightLocale;

	constructor(config?: Partial<HighlightConfig>) {
		this.config = { ...config };
		this.colors = resolveColors(config?.colors, HIGHLIGHT_PALETTE, 'HighlightPlugin');
	}

	async init(context: PluginContext): Promise<void> {
		this.locale = await resolveLocale(
			context,
			this.config.locale,
			HIGHLIGHT_LOCALE_EN,
			loadHighlightLocale,
		);

		context.registerStyleSheet(COLOR_PICKER_CSS);
		this.registerMarkSpec(context);
		this.registerCommands(context);
		this.registerToolbarItem(context);
	}

	private registerMarkSpec(context: PluginContext): void {
		context.registerMarkSpec(
			createInlineStyleMarkSpec({
				type: 'highlight',
				rank: 4,
				valueAttr: 'color',
				domStyleProperty: 'backgroundColor',
				cssProperty: 'background-color',
				validate: isValidCSSColor,
				validateOnParse: true,
			}),
		);
	}

	private registerCommands(context: PluginContext): void {
		context.registerCommand('removeHighlight', () => {
			return removeColorMark(context, context.getState(), 'highlight');
		});
	}

	private registerToolbarItem(context: PluginContext): void {
		const icon: string =
			'<?xml version="1.0" encoding="UTF-8" standalone="no"?> <svg enable-background="new 0 0 24 24" viewBox="0 0 24 24" fill="currentColor" version="1.1" id="svg4" width="24" height="24" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg"> <defs id="defs4" /> <g id="g1"> <rect fill="none" height="24" width="24" id="rect1" x="0" y="0" /> </g> <g id="g4"> <g id="g3"> <path d="M 8.94,16.56 C 9.23,16.85 9.62,17 10,17 c 0.38,0 0.77,-0.15 1.06,-0.44 l 5.5,-5.5 c 0.59,-0.58 0.59,-1.53 0,-2.12 L 8.32,0.7 C 7.93,0.31 7.3,0.31 6.91,0.7 6.52,1.09 6.52,1.72 6.91,2.11 L 8.59,3.79 3.44,8.94 c -0.59,0.59 -0.59,1.54 0,2.12 z M 10,5.21 14.79,10 H 5.21 Z" enable-background="new" id="path1" /> <path d="m 19,17 c 1.1,0 2,-0.9 2,-2 0,-1.33 -2,-3.5 -2,-3.5 0,0 -2,2.17 -2,3.5 0,1.1 0.9,2 2,2 z" enable-background="new" id="path2" /> <path d="M 20,20 H 4 c -1.1,0 -2,0.9 -2,2 0,1.1 0.9,2 2,2 h 16 c 1.1,0 2,-0.9 2,-2 0,-1.1 -0.9,-2 -2,-2 z" enable-background="new" id="path3" style="fill:#fbbf24;fill-opacity:1" /> </g> </g> </svg>';

		context.registerToolbarItem({
			id: 'highlight',
			group: 'format',
			icon,
			label: this.locale.label,
			tooltip: this.locale.tooltip,
			command: 'removeHighlight',
			popupType: 'custom',
			renderPopup: (container, ctx, onClose) => {
				renderColorPickerPopup(container, ctx, {
					markType: 'highlight',
					colors: this.colors,
					columns: 10,
					resetLabel: this.locale.resetLabel,
					resetCommand: 'removeHighlight',
					ariaLabelPrefix: this.locale.ariaLabelPrefix,
					onClose,
				});
			},
			isActive: (state: EditorState) => isColorMarkActive(state, 'highlight'),
		});
	}
}
