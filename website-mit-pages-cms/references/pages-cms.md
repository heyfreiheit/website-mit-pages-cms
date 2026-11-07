# Pages CMS: Konfiguration und Fallen

Pages CMS (pagescms.org, Open Source) ist eine Redaktionsoberfläche für Dateien in einem GitHub-Repo. Es hat keine eigene Datenbank. Speichern heißt: Datei ändern, Commit auf den Branch. Die Konfiguration steht in `.pages.yml` im Projektstamm. Volle Doku: pagescms.org/docs.

## Grundgerüst

```yaml
media:
  input: public/img          # wo hochgeladene Dateien im Repo landen
  output: /img               # welcher Pfad in die Inhalte geschrieben wird
  extensions: [jpg, jpeg, png, webp]
  rename: safe               # Dateinamen bereinigen (keine Leerzeichen, Umlaute)

settings:
  commit:
    templates:
      create: "Pages CMS: {path} angelegt"
      update: "Pages CMS: {path} geändert"
      delete: "Pages CMS: {path} gelöscht"
      rename: "Pages CMS: {oldPath} umbenannt in {newPath}"

components:
  t:                         # kurzer Text in jeder Sprache
    type: object
    fields:
      - { name: de, label: Deutsch, type: string }
      - { name: en, label: English, type: string }
  tl:                        # langer Text in jeder Sprache
    type: object
    fields:
      - { name: de, label: Deutsch, type: text }
      - { name: en, label: English, type: text }
  alt:                       # Bildbeschreibung
    type: object
    label: Bildbeschreibung
    description: Was ist auf dem Foto zu sehen? Für Screenreader und Google.
    fields:
      - { name: de, label: Deutsch, type: string }
      - { name: en, label: English, type: string }

content:
  - name: startseite
    label: Startseite
    type: group
    items:
      - name: hero
        label: Einstieg
        type: file
        path: src/content/home/hero.json
        format: json
        fields:
          - { name: title, label: Überschrift, component: t }
          - { name: text, label: Text, component: tl }
          - name: image
            label: Foto
            type: image
            required: true
            description: "Austauschen: Papierkorb unten rechts im Bild, dann Upload."
          - { name: alt, component: alt }

  - name: team
    label: Team
    type: file
    path: src/content/team.json
    format: json
    fields:
      - name: items
        label: Team
        type: object
        list:
          min: 1
          collapsible: { collapsed: true, summary: "{name}" }
        fields:
          - { name: name, label: Name, type: string, required: true }
          - { name: role, label: Rolle, component: t }
          - { name: photo, label: Foto, type: image }
```

Ein Eintrag mit `type: file` bearbeitet genau eine Datei. `type: collection` ist für Ordner mit vielen gleichartigen Dateien (Blogartikel als Markdown). Für Webseiten-Abschnitte ist `file` fast immer richtig.

## Feldtypen

| Typ | Wofür | Optionen |
|---|---|---|
| `string` | einzeilig | `options: { maxlength }`, `pattern` |
| `text` | mehrzeilig | `options: { maxlength }` |
| `rich-text` | formatierter Text | `options: { format: markdown }` |
| `number` | Zahl | `options: { min, max }` |
| `boolean` | an/aus | |
| `date` | Datum | `options: { format: yyyy-MM-dd }` |
| `select` | Auswahl | `options: { values: [ { name, label } ], multiple: true }` |
| `image` | Foto | `options: { multiple, extensions }` |
| `object` | Gruppe von Feldern | `fields: [ … ]` |

Für jedes Feld gibt es zusätzlich `label`, `description`, `required`, `readonly`, `hidden` und `list`. `list: true` macht aus jedem Feld eine Liste. Mit `list: { min, max, collapsible }` begrenzt du die Anzahl und klappst Einträge zu. Mit `component: <name>` nutzt du einen Baustein aus `components` wieder.

## Die Fallen

1. **Pages CMS löscht, was es nicht kennt.** Beim Speichern wird die Datei aus dem Schema neu geschrieben. Jedes Feld, das die Seite braucht, muss in `.pages.yml` stehen. Prüfen mit `node $SK/scripts/check-pages-config.mjs .`. Es gibt zwar `settings: { content: { merge: true } }`, das unbekannte Felder behält, aber verlass dich nicht darauf, ein vollständiges Schema ist sauberer.
2. **Keine Liste auf oberster Ebene.** Eine JSON-Datei, die mit `[` beginnt, erscheint als leeres Formular, auch wenn die Doku `list: true` am Eintrag erwähnt. Immer `{ "items": [ … ] }` und ein Feld `items` mit `list`.
3. **Sprachkürzel `no` in Anführungszeichen.** In YAML kann `no` als „false“ gelesen werden. Schreib `name: "no"` (gilt auch für `yes`, `on`, `off`).
4. **Kommas in Kurzschreibweise.** In `{ name: x, label: Text, mit Komma }` trennt das Komma die Felder. Texte mit Komma oder Doppelpunkt in Anführungszeichen setzen.
5. **`{userName}` in Commit-Vorlagen bleibt leer**, wenn Pages CMS als App committet. Lieber weglassen.
6. **Bild austauschen ist nicht offensichtlich.** Im Vorschaubild unten rechts sind ein Pfeil (öffnet die Datei auf GitHub) und ein Papierkorb. Erst der Papierkorb zeigt wieder „Upload“ und „Select“. Deshalb an jedes Bildfeld eine `description` mit genau diesem Hinweis.
7. **Zurücksetzen auf den alten Wert speichert manchmal nicht.** Pages CMS erkennt die Änderung dann nicht. Zurücksetzen nach einem Test deshalb direkt per Git.
8. **Die Mediathek zeigt alle Dateien** in `public/img/`, also auch die automatisch erzeugten `-s.webp`-Varianten. Das ist normal.

## Prüfen

```bash
node $SK/scripts/check-pages-config.mjs <projektordner>
```

Das Skript meldet:
- Felder in den Daten, die im Schema fehlen (die würden gelöscht)
- Dateien, deren oberste Ebene eine Liste ist
- Sprachkürzel, die YAML als true/false liest
- Werte, die nicht zum Feldtyp passen (Text in Zahlenfeld, unbekannte Auswahlwerte)
- Bildpfade, deren Datei es nicht gibt
- Listen, die `min` oder `max` verletzen

Hinweise wie „missing in data“ sind keine Fehler. Sie heißen nur, dass ein optionales Feld in manchen Einträgen leer ist.

## Verbinden und Übergeben

1. app.pagescms.org → „Sign in with GitHub“.
2. GitHub-App installieren, auf dem Account oder der Organisation, der das Repo gehört. Nur dieses Repo freigeben reicht.
3. Repo und Branch öffnen. Links erscheinen die Einträge aus `.pages.yml`.
4. Kunde einladen: Menü „Collaborators“, E-Mail-Adresse eintragen. Der Kunde meldet sich per E-Mail an und braucht keinen GitHub-Account. Vor der Übergabe einmal mit einer eigenen zweiten Adresse ausprobieren.
5. Jede Speicherung ist ein Commit auf `main`. Wenn der Hoster bei jedem Push neu baut, ist die Änderung nach ein bis zwei Minuten online.
