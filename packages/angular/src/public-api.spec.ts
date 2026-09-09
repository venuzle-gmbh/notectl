import * as coreFullApi from '@venuzle/notectl/full';
import { describe, expect, it } from 'vitest';

import * as angularApi from './public-api.js';

function pluginExportNames(api: object): string[] {
	return Object.keys(api)
		.filter((name) => name.endsWith('Plugin'))
		.sort();
}

describe('@venuzle/notectl-angular public API', () => {
	it('re-exports every public core plugin constructor', () => {
		expect(pluginExportNames(angularApi)).toEqual(pluginExportNames(coreFullApi));
	});
});
