// Content layer.
//
// Every page reads its content ONLY through this file. The JSON files in
// src/content/ are edited by the client in Pages CMS (config: .pages.yml).
// Each save there is a commit, which triggers a new build.
//
// Adapt: the imports, LOCALES and the getters to the project's content files.

import settings from '../content/settings.json';
import hero from '../content/home/hero.json';
// import about from '../content/home/about.json';
// import team from '../content/team.json';

export const LOCALES = ['de', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'de';

/** A field that exists once per language, e.g. { de: '…', en: '…' }. */
export type Localized<T = string> = Record<Locale, T>;

/** Resolve a localized field. Plain values (names, numbers) pass through.
 *  An empty translation falls back to the default language, so nothing renders blank. */
export function t<T>(value: Localized<T> | T, locale: Locale): T {
  if (value && typeof value === 'object' && !Array.isArray(value) && locale in (value as object)) {
    const all = value as Localized<T>;
    const filled = (v: unknown) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0);
    return ([all[locale], all[DEFAULT_LOCALE], ...Object.values(all)].find(filled) ?? all[locale]) as T;
  }
  return value as T;
}

/** Responsive sources for an image path from the CMS, e.g. "/img/team-anna.jpg".
 *  tools/images.mjs creates "<name>.webp" (2000 px) and "<name>-s.webp" (900 px) for every upload. */
export function picture(path: string) {
  const base = path.replace(/\.(webp|jpe?g|png|avif)$/i, '');
  const large = `${base}.webp`;
  const small = `${base}-s.webp`;
  return { large, small, srcset: `${small} 900w, ${large} 2000w` };
}

export function getSettings() {
  return settings;
}

export function getHomePage() {
  return { hero };
}

// Lists live under "items" because Pages CMS cannot edit a file whose top level is an array.
// export function getTeam() {
//   return team.items;
// }
