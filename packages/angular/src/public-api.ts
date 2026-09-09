/**
 * @venuzle/notectl-angular — Angular integration for the notectl rich text editor.
 * @packageDocumentation
 */

// --- Angular Bindings ---
export { NotectlEditorComponent } from './lib/notectl-editor.component';
export { NotectlValueAccessorDirective } from './lib/value-accessor.directive';
export { NotectlEditorService } from './lib/notectl-editor.service';

// --- Provider Function ---
export {
	provideNotectl,
	type NotectlProviderOptions,
} from './lib/tokens';

// --- Injection Tokens ---
export {
	NOTECTL_DEFAULT_CONFIG,
	NOTECTL_CONTENT_FORMAT,
	type ContentFormat,
} from './lib/tokens';

// --- Angular-specific Types ---
export type { NotectlValue, SelectionChangeEvent } from './lib/types';

// --- Re-exports from @venuzle/notectl (convenience) ---

// Model types
export type {
	Document,
	BlockNode,
	TextNode,
	InlineNode,
	Mark,
	BlockAttrs,
} from '@venuzle/notectl';

// Selection types
export type { EditorSelection, Position, Selection } from '@venuzle/notectl';

// State types
export type {
	EditorState,
	Transaction,
	TransactionMetadata,
	StateChangeEvent,
} from '@venuzle/notectl';

// Plugin types
export type { Plugin, PluginConfig, PluginContext } from '@venuzle/notectl';

// Theme types
export type { Theme, PartialTheme, ThemePrimitives } from '@venuzle/notectl';
export { ThemePreset, LIGHT_THEME, DARK_THEME, createTheme } from '@venuzle/notectl';

// Editor config
export type { NotectlEditorConfig } from '@venuzle/notectl';

// HTML serialization option types (from sub-path export)
export type { ContentCSSResult, ContentHTMLOptions } from '@venuzle/notectl/html';

// Plugin config types (from sub-path exports)
export type { TextFormattingConfig } from '@venuzle/notectl/plugins/text-formatting';
export type { FontDefinition } from '@venuzle/notectl/plugins/font';

// Starter fonts
/** @deprecated Import from '@venuzle/notectl/fonts/starter' instead. */
export { STARTER_FONTS } from '@venuzle/notectl/fonts/starter';

// Plugins (tree-shakable re-exports from sub-paths)
export { TextFormattingPlugin } from '@venuzle/notectl/plugins/text-formatting';
export { HeadingPlugin } from '@venuzle/notectl/plugins/heading';
export { ListPlugin } from '@venuzle/notectl/plugins/list';
export { LinkPlugin } from '@venuzle/notectl/plugins/link';
export { TablePlugin } from '@venuzle/notectl/plugins/table';
export { InlineCodePlugin } from '@venuzle/notectl/plugins/inline-code';
export { CodeBlockPlugin } from '@venuzle/notectl/plugins/code-block';
export { BlockquotePlugin } from '@venuzle/notectl/plugins/blockquote';
export { ImagePlugin } from '@venuzle/notectl/plugins/image';
export { VideoPlugin } from '@venuzle/notectl/plugins/video';
export { FormulaPlugin } from '@venuzle/notectl/plugins/formula';
export { FontSizePlugin } from '@venuzle/notectl/plugins/font-size';
export { FontPlugin } from '@venuzle/notectl/plugins/font';
export { TextColorPlugin } from '@venuzle/notectl/plugins/text-color';
export { AlignmentPlugin } from '@venuzle/notectl/plugins/alignment';
export { StrikethroughPlugin } from '@venuzle/notectl/plugins/strikethrough';
export { SuperSubPlugin } from '@venuzle/notectl/plugins/super-sub';
export { HighlightPlugin } from '@venuzle/notectl/plugins/highlight';
export { HorizontalRulePlugin } from '@venuzle/notectl/plugins/horizontal-rule';
export { HardBreakPlugin } from '@venuzle/notectl/plugins/hard-break';
export { PrintPlugin } from '@venuzle/notectl/plugins/print';
export { SmartPastePlugin } from '@venuzle/notectl/plugins/smart-paste';
export { ToolbarPlugin } from '@venuzle/notectl/plugins/toolbar';
export { TextDirectionPlugin } from '@venuzle/notectl/plugins/text-direction';
export { BidiIsolationPlugin } from '@venuzle/notectl/plugins/bidi-isolation';
export { TextDirectionAutoPlugin } from '@venuzle/notectl/plugins/text-direction-auto';
export { CaretNavigationPlugin } from '@venuzle/notectl/plugins/caret-navigation';
export { GapCursorPlugin } from '@venuzle/notectl/plugins/gap-cursor';
