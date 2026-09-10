# notectl

### Rich text editing as a Web Component

Build a real editor in plain HTML, React, Vue, Svelte, or Angular without locking yourself into a framework-specific editor runtime.

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Web Component](https://img.shields.io/badge/Web_Component-%3Cnotectl--editor%3E-purple)](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/@venuzle/notectl)](https://www.npmjs.com/package/@venuzle/notectl)
[![Bundle Size](https://img.shields.io/badge/gzip-~76kb_core-orange)](https://www.npmjs.com/package/@venuzle/notectl)

## Changes from original repository

This project was forked from [https://github.com/Samyssmile/notectl](https://github.com/Samyssmile/notectl) at v2.3.6. The following changes have been made:

- Renamed package to `@venuzle/notectl`
- Added .vscode folder to include extension recommendations and autoformat settings
- Added `getView(): EditorView | null` method to `PluginContext`
- Added `UndoPlugin` and `RedoPlugin`

## Documentation

- **Internal documentation [https://venuzle.atlassian.net/wiki/x/AQBNnQ](https://venuzle.atlassian.net/wiki/x/AQBNnQ)**
---
- Getting started: https://samyssmile.github.io/notectl/getting-started/installation/
- Quick start: https://samyssmile.github.io/notectl/getting-started/quick-start/
- Angular guide: https://samyssmile.github.io/notectl/guides/angular/
- Plugin docs: https://samyssmile.github.io/notectl/plugins/overview/
- Architecture overview: https://samyssmile.github.io/notectl/architecture/overview/

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm test:e2e
pnpm lint
pnpm typecheck

pnpm login
./publish
```

## Examples

- Vanilla example: https://github.com/venuzle-gmbh/notectl/tree/main/examples/vanillajs
- Angular example: https://github.com/venuzle-gmbh/notectl/tree/main/examples/angular

## License

MIT
