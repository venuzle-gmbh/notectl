/**
 * Full entry point — re-exports everything for UMD builds and legacy consumers.
 *
 * For ESM consumers, prefer importing from specific sub-paths:
 * - `@venuzle/notectl` — core framework (model, state, view, plugin system)
 * - `@venuzle/notectl/html` — HTML serialization/parsing
 * - `@venuzle/notectl/presets` — preset factory functions
 * - `@venuzle/notectl/fonts/starter` and `/fonts/math` — embedded font definitions
 * - `@venuzle/notectl/plugins/<name>` — individual plugins
 *
 * @example
 * ```ts
 * // UMD / kitchen-sink import:
 * import * as NotectlCore from '@venuzle/notectl/full';
 * ```
 */

// --- Core Framework ---
export * from './index.js';

// --- HTML Serialization / Parsing ---
export * from './html.js';

// --- Presets ---
export * from './presets.js';

// --- Fonts ---
export * from './fonts.js';

// --- All Plugins ---
export * from './plugins/text-formatting/index.js';
export * from './plugins/heading/index.js';
export * from './plugins/toolbar/index.js';
export * from './plugins/shared/index.js';
export * from './plugins/table/index.js';
export * from './plugins/image/index.js';
export * from './plugins/formula/index.js';
export * from './plugins/video/index.js';
export * from './plugins/code-block/index.js';
export * from './plugins/link/index.js';
export * from './plugins/list/index.js';
export * from './plugins/blockquote/index.js';
export * from './plugins/strikethrough/index.js';
export * from './plugins/inline-code/index.js';
export * from './plugins/text-color/index.js';
export * from './plugins/horizontal-rule/index.js';
export * from './plugins/alignment/index.js';
export * from './plugins/font/index.js';
export * from './plugins/font-size/index.js';
export * from './plugins/highlight/index.js';
export * from './plugins/super-sub/index.js';
export * from './plugins/hard-break/index.js';
export * from './plugins/gap-cursor/index.js';
export * from './plugins/caret-navigation/index.js';
export * from './plugins/print/index.js';
export * from './plugins/smart-paste/index.js';
export * from './plugins/language/index.js';
export * from './plugins/text-direction/index.js';
export * from './plugins/bidi-isolation/index.js';
export * from './plugins/text-direction-auto/index.js';
