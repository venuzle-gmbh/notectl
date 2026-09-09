/** Locale interface and default English locale for the UndoPlugin. */

import { type LocaleModuleMap, loadLocaleModule } from '../shared/LocaleLoader.js';

// --- Locale Interface ---

export interface UndoLocale {
	readonly label: string;
	readonly tooltip: (shortcut: string) => string;
}

// --- Default English Locale ---

export const UNDO_LOCALE_EN: UndoLocale = {
	label: 'Undo',
	tooltip: (shortcut: string) => `Undo (${shortcut})`,
};

// --- Lazy Locale Loader ---

const localeModules: LocaleModuleMap<UndoLocale> = import.meta.glob<{
	default: UndoLocale;
}>('./locales/*.ts', { eager: false });

export async function loadUndoLocale(lang: string): Promise<UndoLocale> {
	return loadLocaleModule(localeModules, lang, UNDO_LOCALE_EN);
}
