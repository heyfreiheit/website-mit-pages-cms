# Architektur: so wird die Seite CMS-fähig

Pages CMS bearbeitet Dateien im Repo. Damit das sauber klappt, muss die Seite von Anfang an so gebaut sein, dass alle pflegbaren Inhalte in Datendateien stehen und das Layout im Code. Diese Regeln gelten für jede Seite, die mit diesem Skill entsteht.

## Projekt

Astro, statisch gebaut. Das reicht, weil jede Änderung im CMS ein Commit ist und danach neu gebaut wird.

```bash
npm create astro@latest <name> -- --template minimal --no-install --no-git --skip-houston
cd <name> && npm install
npm i sharp
npm i -D yaml
```

`astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://www.beispiel.de',   // echte Domain eintragen
  trailingSlash: 'always',
  build: { format: 'directory' },
});
```

Nur wenn es einen echten Grund für Server-Rendering gibt (Formular-Backend, Login), auf `@astrojs/node` umstellen. Das braucht beim Hoster Node.js-Hosting und kostet mehr.

Mit Scrollcraft: Engine `scrollcraft.js` nach `public/js/`, `scrollcraft.css` nach `src/styles/`, beide unverändert. Eigene Logik in `src/scripts/`, eigene Gestaltung in `src/styles/site.css`.

Mit Impeccable: `.impeccable/` (Arbeitsdateien) in die `.gitignore`, `PRODUCT.md` und `DESIGN.md` committen. Impeccable ausdrücklich sagen, dass Texte und Bilder aus `src/lib/content.ts` kommen.

## Ordner

```
.pages.yml                 Pages-CMS-Konfiguration
public/img/                alle Fotos (WebP, je <name>.webp und <name>-s.webp)
src/content/               alle pflegbaren Inhalte als JSON
  settings.json            Name, Kontakt, Adresse, Öffnungszeiten, Links
  home/hero.json           ein Abschnitt der Startseite pro Datei
  home/…json
  team.json                Listen immer als { "items": [ … ] }
src/lib/content.ts         einzige Stelle, die Inhalte lädt
src/pages/                 Seiten, lesen nur aus content.ts
tools/images.mjs           erzeugt WebP-Größen für hochgeladene Fotos
gen/src/                   Original-Fotos, nicht im Repo
```

## Regeln für die JSON-Dateien

1. **Eine Datei pro Abschnitt.** Lieber acht kleine Dateien als eine große. Jede wird im CMS ein eigener Menüpunkt, der Kunde findet sich schneller zurecht.
2. **Oberste Ebene immer ein Objekt.** Eine Datei, die mit `[` beginnt, zeigt Pages CMS als leeres Formular an. Speichert dort jemand, ist der Inhalt weg. Listen deshalb so:
   ```json
   { "items": [ { "name": "…" }, { "name": "…" } ] }
   ```
3. **Mehrsprachig:** jedes Textfeld als Objekt mit einem Schlüssel pro Sprache.
   ```json
   { "title": { "de": "Willkommen", "en": "Welcome" } }
   ```
   Bei nur einer Sprache einfach Strings, ohne Sprach-Objekt.
4. **Bilder als Pfad**, genau so, wie Pages CMS sie speichert: `"image": "/img/sauna.webp"`. Dazu immer ein Feld für die Bildbeschreibung (`alt`).
5. **Zahlen, die gerechnet werden** (Preise, Entfernungen), in `content.ts` mit `Number()` umwandeln. Man weiß nie sicher, ob ein Editor sie als Text speichert.
6. **Keine technischen Hilfsfelder** wie `_type` oder `_id`. Alles, was in der Datei steht, muss auch in `.pages.yml` stehen, sonst löscht Pages CMS es.
7. **Feste Mengen**, die das Layout braucht (genau drei Karten, genau vier Fotos), im CMS-Schema mit `min` und `max` absichern.
8. **Leere optionale Felder** müssen der Seite egal sein: im Template immer prüfen (`{x.season && t(x.season) && …}`).

## Was nicht ins CMS gehört

- Freigestellte Bildebenen, Masken, Videos für Scroll-Animationen, Fotos mit fest eingebauten Koordinaten (z. B. ein Lichteffekt genau auf einer Laterne). Ersetzt der Kunde sie, bricht die Animation.
- Layout, Farben, Schriften, Reihenfolge der Abschnitte. Das bleibt Entwicklerarbeit, und genau das ist bei einer Übergabe gewollt.

Alles andere, also Texte, Zeiten, Preise, Kontakte, Links und normale Fotos, gehört ins CMS.

## Mehrsprachigkeit

Routen `/de/`, `/en/` usw. über `src/pages/[lang]/index.astro`:

```astro
---
import { LOCALES, type Locale } from '../../lib/content';
export function getStaticPaths() {
  return LOCALES.map((lang) => ({ params: { lang } }));
}
const locale = Astro.params.lang as Locale;
---
```

Die Startseite `/` leitet weiter. Statisch geht das mit einer kleinen Seite: `<meta http-equiv="refresh" content="0; url=/de/">` plus ein Skript, das vorher `navigator.language` prüft und auf die passende Sprache springt. Dazu `hreflang`-Links im `<head>` jeder Sprachversion.

## Bilder

`tools/images.mjs` (Vorlage: `$SK/scripts/images.mjs`) erzeugt für jedes Foto in `public/img/` die Varianten `<name>.webp` (max. 2000 px) und `<name>-s.webp` (900 px), wenn sie fehlen. Vorhandene Dateien fasst es nie an.

`package.json`:

```json
"scripts": {
  "images": "node tools/images.mjs",
  "predev": "node tools/images.mjs",
  "prebuild": "node tools/images.mjs",
  "dev": "astro dev",
  "build": "astro build"
}
```

Im Template immer über `picture()` aus `content.ts`:

```astro
---
const p = picture(item.image);
---
<img src={p.small} srcset={p.srcset} sizes="(max-width: 700px) 90vw, 40vw" alt={t(item.alt, locale)} loading="lazy" />
```

So darf der Kunde ein JPG vom Handy hochladen: Beim nächsten Build entstehen die WebP-Dateien, und die Seite lädt sie.

## Vor Phase 4 prüfen

- `npm run build` läuft fehlerfrei
- `grep -rn "src/content" src/pages` findet nichts (Seiten importieren nur aus `content.ts`)
- keine JSON-Datei beginnt mit `[`: `grep -l '^\[' -r src/content` gibt nichts aus
- jeder sichtbare Text auf der Seite kommt aus einer JSON-Datei (stichprobenartig: einen Text in der JSON ändern, Seite neu laden)
