/** Locale interface and default English locale for the RedoPlugin. */

import { type LocaleModuleMap, loadLocaleModule } from '../shared/LocaleLoader.js';

// --- Locale Interface ---

export interface RedoLocale {
	readonly label: string;
	readonly tooltip: (shortcut: string) => string;
}

// --- Default English Locale ---

export const REDO_LOCALE_EN: RedoLocale = {
	label: 'Redo',
	tooltip: (shortcut: string) => `Redo (${shortcut})`,
};

// --- Lazy Locale Loader ---

const localeModules: LocaleModuleMap<RedoLocale> = import.meta.glob<{
	default: RedoLocale;
}>('./locales/*.ts', { eager: false });

export async function loadRedoLocale(lang: string): Promise<RedoLocale> {
	return loadLocaleModule(localeModules, lang, REDO_LOCALE_EN);
}
