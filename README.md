# Website mit Pages CMS

Ein Skill für Claude Code (läuft auch mit Codex).

Mit diesem Skill baust du mit Claude Code eine richtig hochwertige Webseite und übergibst sie so an deinen Kunden, dass er Texte und Fotos selbst ändern kann. Ohne WordPress, ohne Datenbank, ohne Plugin-Updates.

Der Skill führt Claude durch den kompletten Weg: Seite mit dem Scrollcraft-Skill bauen, so aufbauen, dass alle Inhalte pflegbar sind, in ein privates GitHub-Repo legen, Pages CMS als Redaktionsoberfläche einrichten und auf Wunsch bei Hostinger veröffentlichen. Am Ende bekommst du noch eine Übergabe-Checkliste und eine kurze Anleitung für deinen Kunden.

## Installation

1. Repo holen und den Skill-Ordner in deine Skills kopieren:
   ```bash
   git clone https://github.com/heyfreiheit/website-mit-pages-cms.git
   cp -R website-mit-pages-cms/website-mit-pages-cms ~/.claude/skills/
   ```
   Ohne Git: oben auf „Code“ → „Download ZIP“, entpacken und den inneren Ordner `website-mit-pages-cms` nach `~/.claude/skills/` legen. Für Codex kommt er nach `~/.codex/skills/`.
2. Für die schicken Scroll-Animationen den Scrollcraft-Skill von Nate Herk installieren (kostenlos, MIT-Lizenz). In Claude Code:
   ```
   /plugin marketplace add nateherkai/scroll-craft
   /plugin install nateherk-design
   ```
   Ohne Scrollcraft funktioniert der Skill auch, die Seite wird dann nur weniger aufwendig animiert.
3. Claude Code in einem leeren Ordner starten und z. B. sagen: **„Bau mir eine Webseite für <Kunde> mit Pages CMS, die ich übergeben kann.“**

## Was du brauchst

- Node.js 22 oder neuer und Git
- GitHub-Account und die GitHub-CLI (`gh auth login`)
- einen kostenlosen Account bei Pages CMS (app.pagescms.org, Anmeldung mit GitHub)
- optional Hostinger zum Veröffentlichen. Der Skill erklärt dir, welcher Tarif für was reicht.

## So läuft es ab

Claude fragt dich kurz nach Kunde, Sprachen und Hosting. Dann baut Scrollcraft die Seite mit eigenem Interview zu Stil und Aufbau. Danach kommt das Repo, dann Pages CMS. Den Pages-CMS-Teil prüft ein mitgeliefertes Skript Feld für Feld, weil Pages CMS beim Speichern alles löscht, was nicht in seiner Konfiguration steht. Das ist die größte Falle, und die ist damit abgefangen.

Bei zwei Schritten musst du selbst ran: bei der Anmeldung in Pages CMS und bei den Einstellungen im Hostinger-Panel. Claude sagt dir genau, was du wo eintragen musst.

## Dateien

Alles liegt im Ordner `website-mit-pages-cms/`:


- `SKILL.md`: der Ablauf für Claude
- `references/architektur.md`: wie die Seite aufgebaut sein muss, damit das CMS funktioniert
- `references/pages-cms.md`: Konfiguration, Feldtypen und alle Fallen, die ich beim Testen gefunden habe
- `references/hostinger.md`: Veröffentlichen bei Hostinger, je nach Tarif
- `references/uebergabe.md`: Checkliste und Anleitung für deinen Kunden
- `scripts/check-pages-config.mjs`: prüft die CMS-Konfiguration gegen deine Inhalte
- `scripts/images.mjs`: macht aus hochgeladenen Handyfotos automatisch schnelle WebP-Bilder
- `templates/content.ts`: Vorlage für die Datei, über die die Seite ihre Inhalte lädt

## Lizenz

MIT, siehe `LICENSE`. Scrollcraft ist ein eigenständiger Skill von Nate Herk (github.com/nateherkai/scroll-craft) und nicht Teil dieses Repos.
