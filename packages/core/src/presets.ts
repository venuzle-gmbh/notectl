/**
 * Preset factory functions entry point (barrel).
 *
 * For smaller bundles, prefer the granular sub-path imports:
 * - `@venuzle/notectl/presets/minimal` — minimal preset only (~5 KB gzip)
 * - `@venuzle/notectl/presets/full` — full preset with all plugins (~60 KB gzip)
 *
 * This barrel re-exports both for backward compatibility.
 *
 * @example
 * ```ts
 * import { createFullPreset } from '@venuzle/notectl/presets';
 * import { STARTER_FONTS } from '@venuzle/notectl/fonts/starter';
 *
 * const preset = createFullPreset({ font: { fonts: STARTER_FONTS } });
 * ```
 */
export * from './presets/minimal.js';
export * from './presets/full.js';
