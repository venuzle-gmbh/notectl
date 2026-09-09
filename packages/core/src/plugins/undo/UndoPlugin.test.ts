import { describe, it } from 'vitest';
import {
	expectCommandRegistered,
	expectToolbarItem,
} from '../../test/PluginTestUtils.js';
import { pluginHarness } from '../../test/TestUtils.js';
import { UndoPlugin } from './UndoPlugin.js';

// --- Tests ---

describe('UndoPlugin', () => {
	describe('commands', () => {
		it('registers toolbarUndo command', async () => {
			const h = await pluginHarness(new UndoPlugin());
			expectCommandRegistered(h, 'toolbarUndo');
		});
	});

	describe('toolbar item', () => {
		it('registers a undo toolbar item', async () => {
			const h = await pluginHarness(new UndoPlugin());
			expectToolbarItem(h, 'undo', {
				group: 'history',
				label: 'Undo',
				command: 'toolbarUndo',
			});
		});
	});
});
