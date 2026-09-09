import { describe, it } from 'vitest';
import {
	expectCommandRegistered,
	expectToolbarItem,
} from '../../test/PluginTestUtils.js';
import { pluginHarness } from '../../test/TestUtils.js';
import { RedoPlugin } from './RedoPlugin.js';

// --- Tests ---

describe('RedoPlugin', () => {
	describe('commands', () => {
		it('registers toolbarRedo command', async () => {
			const h = await pluginHarness(new RedoPlugin());
			expectCommandRegistered(h, 'toolbarRedo');
		});
	});

	describe('toolbar item', () => {
		it('registers a redo toolbar item', async () => {
			const h = await pluginHarness(new RedoPlugin());
			expectToolbarItem(h, 'redo', {
				group: 'history',
				label: 'Redo',
				command: 'toolbarRedo',
			});
		});
	});
});
