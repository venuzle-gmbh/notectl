/**
 * Full preset entry point.
 *
 * Import from '@venuzle/notectl/presets/full' to get the full preset
 * with all standard plugins.
 *
 * @example
 * ```ts
 * import { createFullPreset } from '@venuzle/notectl/presets/full';
 * import { STARTER_FONTS } from '@venuzle/notectl/fonts/starter';
 *
 * const preset = createFullPreset({ font: { fonts: STARTER_FONTS } });
 * ```
 */
export type { PresetConfig, FullPresetOptions } from './PresetTypes.js';
export { createFullPreset } from './FullPreset.js';
