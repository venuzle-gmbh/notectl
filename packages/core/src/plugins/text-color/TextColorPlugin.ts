/**
 * TextColorPlugin: registers a text color mark with attrs,
 * toolbar button with a color picker popup, and removeTextColor command.
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
	TEXT_COLOR_LOCALE_EN,
	type TextColorLocale,
	loadTextColorLocale,
} from './TextColorLocale.js';
import { COLOR_PALETTE } from './TextColorPalette.js';

// --- Attribute Registry Augmentation ---

declare module '../../model/AttrRegistry.js' {
	interface MarkAttrRegistry {
		textColor: { color: string };
	}
}

// --- Configuration ---

export interface TextColorConfig {
	/**
	 * Restricts the color picker to a specific set of hex colors.
	 * Each value must be a valid hex color code (`#RGB` or `#RRGGBB`).
	 * Duplicates are removed automatically (case-insensitive).
	 * When omitted, the full default palette is shown.
	 */
	readonly colors?: readonly string[];
	readonly locale?: TextColorLocale;
}

// --- Plugin ---

export class TextColorPlugin implements Plugin {
	readonly id = 'textColor';
	readonly name = 'Text Color';
	readonly priority = 23;

	private readonly config: TextColorConfig;
	private readonly colors: readonly string[];
	private locale!: TextColorLocale;

	constructor(config?: Partial<TextColorConfig>) {
		this.config = { ...config };
		this.colors = resolveColors(config?.colors, COLOR_PALETTE, 'TextColorPlugin');
	}

	async init(context: PluginContext): Promise<void> {
		this.locale = await resolveLocale(
			context,
			this.config.locale,
			TEXT_COLOR_LOCALE_EN,
			loadTextColorLocale,
		);

		context.registerStyleSheet(COLOR_PICKER_CSS);
		this.registerMarkSpec(context);
		this.registerCommands(context);
		this.registerToolbarItem(context);
	}

	private registerMarkSpec(context: PluginContext): void {
		context.registerMarkSpec(
			createInlineStyleMarkSpec({
				type: 'textColor',
				rank: 5,
				valueAttr: 'color',
				domStyleProperty: 'color',
				cssProperty: 'color',
				validate: isValidCSSColor,
				validateOnParse: true,
			}),
		);
	}

	private registerCommands(context: PluginContext): void {
		context.registerCommand('removeTextColor', () => {
			return removeColorMark(context, context.getState(), 'textColor');
		});
	}

	private registerToolbarItem(context: PluginContext): void {
		const icon: string =
			'<?xml version="1.0" encoding="UTF-8" standalone="no"?> <svg  enable-background="new 0 0 24 24"  viewBox="0 0 24 24"  fill="currentColor"  version="1.1"  id="svg3"  width="24"  height="24"  xmlns="http://www.w3.org/2000/svg"  xmlns:svg="http://www.w3.org/2000/svg">  <defs  id="defs3" />  <g  id="g1">  <rect  fill="none"  height="24"  width="24"  id="rect1"  x="0"  y="0" />  </g>  <g  id="g3">  <g  id="g2">  <path  d="M 20,20 H 4 c -1.1,0 -2,0.9 -2,2 0,1.1 0.9,2 2,2 h 16 c 1.1,0 2,-0.9 2,-2 0,-1.1 -0.9,-2 -2,-2 z"  id="path1"  style="fill:#f43f5e;fill-opacity:1" />  <path  d="m 7.11,17 v 0 c 0.48,0 0.91,-0.3 1.06,-0.75 l 1.01,-2.83 h 5.65 l 0.99,2.82 c 0.16,0.46 0.59,0.76 1.07,0.76 0.79,0 1.33,-0.79 1.05,-1.52 L 13.69,4.17 C 13.43,3.47 12.75,3 12,3 11.25,3 10.57,3.47 10.31,4.17 L 6.06,15.48 C 5.78,16.21 6.33,17 7.11,17 Z M 11.94,5.6 h 0.12 l 2.03,5.79 H 9.91 Z"  id="path2" />  </g>  </g> </svg>';

		context.registerToolbarItem({
			id: 'textColor',
			group: 'format',
			icon,
			label: this.locale.label,
			tooltip: this.locale.tooltip,
			command: 'removeTextColor',
			popupType: 'custom',
			renderPopup: (container, ctx, onClose) => {
				renderColorPickerPopup(container, ctx, {
					markType: 'textColor',
					colors: this.colors,
					columns: 10,
					resetLabel: this.locale.resetLabel,
					resetCommand: 'removeTextColor',
					ariaLabelPrefix: this.locale.ariaLabelPrefix,
					onClose,
				});
			},
			isActive: (state: EditorState) => isColorMarkActive(state, 'textColor'),
		});
	}
}
