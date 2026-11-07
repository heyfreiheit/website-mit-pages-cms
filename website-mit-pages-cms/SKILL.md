---
name: website-mit-pages-cms
description: Kompletter Weg von der Idee zur übergabefertigen Kundenwebseite. Baut eine hochwertige, scroll-animierte Webseite (mit dem Scrollcraft-Skill, falls installiert), legt sie so an, dass alle Texte und Fotos ohne Code pflegbar sind, stellt sie in ein privates GitHub-Repo, richtet Pages CMS als Redaktionsoberfläche für den Kunden ein und führt optional durch die Veröffentlichung bei Hostinger. Verwenden, wenn jemand eine Webseite mit KI bauen und an einen Kunden übergeben will, eine Seite „mit CMS“, „mit Backend“ oder „die der Kunde selbst pflegen kann“ braucht, Pages CMS einbauen will, eine bestehende Astro-Seite an Pages CMS anbinden will oder eine solche Seite bei Hostinger veröffentlichen möchte. Auch bei „Webseite erstellen und übergeben“, „Kunde soll Texte und Bilder selbst ändern“, „.pages.yml“.
---

# Website mit Pages CMS: bauen, anbinden, übergeben

Am Ende steht eine Webseite, die gut aussieht, in einem privaten GitHub-Repo liegt und deren Texte und Fotos der Kunde in Pages CMS selbst ändert. Jede Änderung ist ein Commit, der Hoster baut danach automatisch neu. Es gibt keine Datenbank, kein Plugin-Update und keinen Admin-Bereich, den man absichern muss.

Skill-Ordner (im Folgenden `$SK`): der Ordner dieser Datei, meist `~/.claude/skills/website-mit-pages-cms/`.

Arbeite die Phasen der Reihe nach ab. Nach jeder Phase kurz sagen, was steht, und erst weitermachen, wenn der Nutzer einverstanden ist. Phase 5 (Hosting) ist optional.

## Phase 0: Voraussetzungen prüfen

```bash
node -v            # 22 oder neuer
git --version
gh auth status     # GitHub-CLI angemeldet? Sonst: gh auth login
```

Prüfe außerdem, ob der Scrollcraft-Skill verfügbar ist, also ob `scroll-craft` in der Skill-Liste dieser Sitzung steht. Wenn nicht, dem Nutzer die Installation anbieten (Skill von Nate Herk, MIT-Lizenz):

```text
/plugin marketplace add nateherkai/scroll-craft
/plugin install nateherk-design
```

Ohne Scrollcraft funktioniert der Ablauf trotzdem. Dann baust du die Seite selbst, mit denselben Architektur-Regeln. Gestaltung trotzdem ernst nehmen: echte Fotos, eigene Typografie, keine Standard-Templates.

Fehlt `gh` oder ist es nicht angemeldet, das dem Nutzer sagen. Login-Daten nie selbst eintippen und nie im Chat erfragen.

## Phase 1: Kurz-Interview

Frag in einer Nachricht, nicht als Fragebogen-Marathon:

1. Für wen ist die Seite, und gibt es eine bestehende Seite (URL), deren Inhalte und Fotos wir übernehmen?
2. Welche Sprachen? (Eine Sprache ist der Normalfall, mehrere gehen.)
3. Was soll der Kunde später selbst ändern können? (Standard: alle Texte, Öffnungszeiten, Preise, Kontaktdaten, Fotos.)
4. Wo soll die Seite später laufen? (Hostinger, anderer Hoster, noch offen.)
5. Unter welchem GitHub-Account soll das Repo liegen? (Persönlich oder Organisation.)

Stil, Stimmung und Aufbau klärt Scrollcraft in seinem eigenen Interview. Frag das hier nicht doppelt.

Inhalte von einer bestehenden Seite übernehmen: Texte und Fotos der Seite lesen und herunterladen (nur vom Kunden selbst oder mit seinem Einverständnis). Fotos nach `gen/src/` (nicht ins Repo), daraus WebP-Dateien für `public/img/` erzeugen.

## Phase 2: Seite bauen

Lies zuerst `$SK/references/architektur.md`. Dort steht, wie die Seite aufgebaut sein muss, damit Pages CMS sie später pflegen kann. Diese Regeln gelten zusätzlich zu allem, was Scrollcraft vorgibt, und gehen bei Widerspruch vor. Die wichtigsten:

- **Astro-Projekt** (statisch), nicht eine einzelne HTML-Datei. Scrollcraft liefert Konzept, Brief, Gestaltung, Animationen und seine Engine; umgesetzt wird das als Astro-Seite.
- **Alle pflegbaren Inhalte in JSON-Dateien** unter `src/content/`, eine Datei pro Abschnitt. Nichts davon fest im HTML.
- **Genau eine Ladedatei** `src/lib/content.ts` (Vorlage: `$SK/templates/content.ts`). Seiten holen Inhalte nur von dort.
- **Bilder als Pfad** (`/img/sauna.webp`) in den JSON-Dateien, Dateien in `public/img/`.
- **Keine Datei, deren oberste Ebene eine Liste ist.** Listen immer in ein Feld packen: `{ "items": [ … ] }`.
- Gestaltungs-Bilder, die exakt zur Animation passen müssen (freigestellte Hero-Ebenen, Masken), bleiben fest im Code und kommen nicht ins CMS.

Dann Scrollcraft normal durchlaufen: Interview, Brief, Höhepunkt, Assets, Bau, Prüfung mit Screenshots auf Desktop, Handy und reduzierter Bewegung. Am Ende `npm run build` muss fehlerfrei laufen.

Kopiere `$SK/scripts/images.mjs` nach `tools/images.mjs` im Projekt, installiere `sharp` und trag es als `predev` und `prebuild` ein (siehe architektur.md). Dann darf der Kunde auch Handyfotos als JPG hochladen.

Lege eine `README.md` im Projekt an: Befehle, Aufbau, was im CMS pflegbar ist, offene Punkte.

## Phase 3: Privates GitHub-Repo

```bash
git init -b main
```

`.gitignore` mindestens: `node_modules/`, `dist/`, `.astro/`, `.env`, `.env.*`, `.DS_Store`, Original-Fotos (`gen/src/`).

Vor dem ersten Commit nach Schlüsseln suchen und nichts committen, das wie ein Passwort oder API-Key aussieht:

```bash
git add -A && git diff --cached | grep -inE "(api[_-]?key|secret|token|password)\s*[:=]" || echo "sauber"
```

Dann, mit dem Account aus dem Interview:

```bash
gh repo create <account>/<name> --private --source=. --remote=origin --push
gh repo view <account>/<name> --json visibility,url
```

Prüfe, dass `visibility` wirklich `PRIVATE` ist.

## Phase 4: Pages CMS einrichten

Lies `$SK/references/pages-cms.md`, dort stehen Syntax, Feldtypen und alle Fallen.

1. **`.pages.yml` im Projektstamm schreiben.** Jede Datei aus `src/content/` als eigener Eintrag, Startseiten-Abschnitte in einer Gruppe, deutsche (bzw. kundensprachige) Beschriftungen, kurze Hinweise unter Feldern, wo der Kunde sonst rätseln würde. Für Mehrsprachigkeit eine Komponente mit einem Unterfeld pro Sprache.
2. **Prüfen**, bevor irgendetwas gepusht wird:
   ```bash
   npm i -D yaml        # einmal, falls nicht vorhanden
   node $SK/scripts/check-pages-config.mjs .
   ```
   Das Skript gleicht jede Inhaltsdatei Feld für Feld gegen die Config ab. Es muss `0 problems` melden. Hintergrund: Pages CMS schreibt eine Datei beim Speichern komplett aus dem Schema neu. Ein Feld, das in der Config fehlt, ist nach der ersten Speicherung weg.
3. Committen, pushen.
4. **Nutzer verbindet Pages CMS** (das kann nur er):
   - app.pagescms.org öffnen, mit GitHub anmelden
   - die Pages-CMS-GitHub-App für den Account installieren, auf dem das Repo liegt (Zugriff auf dieses Repo erlauben)
   - Repo und Branch `main` öffnen
5. **Oberfläche durchklicken.** Wenn du Browser-Zugriff hast und der Nutzer angemeldet ist, öffne jede Seite in Pages CMS und schau, ob alle Felder gefüllt erscheinen. Ein leeres Formular, wo Inhalte sein müssten, heißt: Struktur falsch (meist eine Liste auf oberster Ebene). In dem Fall nichts speichern, sondern die Datei umbauen.
6. **Testspeicherung.** Mit Zustimmung des Nutzers einen harmlosen Text ändern und speichern, dann:
   ```bash
   git pull && git show --stat HEAD && git show HEAD
   ```
   Der Diff darf nur den geänderten Wert enthalten. Danach den Testtext wieder zurücksetzen. Am einfachsten direkt per Git: Datei ändern, committen, pushen. Pages CMS ist nur eine Oberfläche über dem Repo.
7. **Kunden einladen.** In Pages CMS unter „Collaborators“ per E-Mail. Der Kunde braucht dann keinen GitHub-Account.

## Phase 5 (optional): Veröffentlichen bei Hostinger

Lies `$SK/references/hostinger.md` und frag den Nutzer, welchen Tarif er hat oder buchen will. Danach richtet sich der Weg. Alles, was im hPanel passiert, macht der Nutzer selbst; du gibst die genauen Werte (Build-Befehl, Ausgabeordner, Node-Version) und baust, was im Repo nötig ist (z. B. einen GitHub-Actions-Workflow).

Vor dem Livegang:
- `noindex` entfernen, falls gesetzt
- Impressum und Datenschutz verlinkt
- Domain und SSL aktiv
- eine Änderung in Pages CMS speichern und prüfen, dass sie nach dem automatischen Build online ist

## Phase 6: Übergabe

Arbeite die Liste in `$SK/references/uebergabe.md` ab und gib dem Nutzer am Ende eine kurze Anleitung für seinen Kunden mit (zwei Absätze: wie man sich anmeldet, wie man Text und Foto ändert, dass Änderungen nach ein bis zwei Minuten online sind).

## Grundsätze

- Ehrlich berichten, was geprüft ist und was nicht. „Baut fehlerfrei“ und „im CMS getestet“ sind zwei verschiedene Dinge.
- Nichts im Namen des Nutzers veröffentlichen, bezahlen oder einladen, ohne dass er es ausdrücklich bestätigt.
- Schlüssel und Passwörter nie in den Chat und nie ins Repo.
- Inhalte und Fotos einer fremden Seite nur übernehmen, wenn der Nutzer sie im Auftrag des Seiteninhabers neu baut.
