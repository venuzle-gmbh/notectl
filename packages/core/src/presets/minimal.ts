/**
 * Minimal preset entry point.
 *
 * Import from '@venuzle/notectl/presets/minimal' to get only the minimal preset
 * without pulling in the full plugin suite.
 *
 * @example
 * ```ts
 * import { createMinimalPreset } from '@venuzle/notectl/presets/minimal';
 * import { STARTER_FONTS } from '@venuzle/notectl/fonts/starter';
 *
 * const preset = createMinimalPreset({ font: { fonts: STARTER_FONTS } });
 * ```
 */
export type { PresetConfig, MinimalPresetOptions } from './PresetTypes.js';
export { createMinimalPreset } from './MinimalPreset.js';
