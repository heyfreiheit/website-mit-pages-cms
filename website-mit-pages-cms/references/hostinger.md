# Veröffentlichen bei Hostinger

Stand der Recherche: November 2026, Quellen: docs.hostinger.com (Node.js, Websites, SSL, Domains) und Hostinger-Support. Hostinger ändert Tarifnamen und Menüs gelegentlich. Wenn etwas im hPanel anders heißt, nach dem sinngemäßen Punkt suchen.

Frag zuerst, welchen Tarif der Nutzer hat. Danach gibt es zwei Wege:

| Tarif | Weg | Baut Hostinger selbst? |
|---|---|---|
| **Web Unlimited** (früher Business), **Cloud** (Startup, Professional, Enterprise) | A: Web-App direkt aus GitHub | ja, bei jedem Push |
| **Premium**, **Single** | B: GitHub Actions baut, lädt per FTP hoch | nein, das macht GitHub |

Beide Wege bauen bei jedem Push neu, also auch nach jeder Speicherung in Pages CMS.

Den klassischen Menüpunkt „Erweitert → Git“ im Website-Dashboard **nicht** für Astro nehmen. Er kopiert nur die Dateien aus dem Repo, ohne `npm run build`. Die Seite würde nie gebaut.

## Weg A: Web-App aus GitHub (Unlimited, Cloud)

Das ist der einfachste Weg. Hostinger holt den Code, installiert, baut und veröffentlicht. Eine statische Astro-Seite braucht dabei keinen laufenden Node-Server.

Im hPanel (macht der Nutzer):

1. **Websites → Website hinzufügen → Node.js-Web-App** (heißt je nach Ansicht auch „Web App“).
2. Unter „Import your Git repository“ auf **Connect with GitHub**. Das installiert die Hostinger-GitHub-App. Dort nur das eine Repo freigeben reicht. Private Repos gehen.
3. Repo und Branch `main` wählen, dann die Build-Einstellungen prüfen:

   | Feld | Statische Astro-Seite (Standard) | Astro mit Node-Server |
   |---|---|---|
   | Framework / Application type | Astro | Astro |
   | Node.js-Version | 22 | 22 |
   | Root directory | leer (Projektstamm) | leer |
   | Build script | `build` | `build` |
   | Output directory | `dist` | `dist` |
   | Entry file | **leer lassen** | `server/entry.mjs` |
   | Package manager | npm | npm |

   Leeres Entry file heißt: Die Seite wird statisch ausgeliefert, es läuft kein Server. Beim Node-Server ist der Pfad relativ zum Ausgabeordner, also `server/entry.mjs` und nicht `dist/server/entry.mjs`. Ein Feld für einen Start-Befehl gibt es nicht. Den Port setzt Hostinger über `PORT`, der Node-Adapter von Astro liest ihn automatisch.
4. **Deploy** klicken. Ab jetzt ist Auto-Deploy an: Jeder Push auf `main` baut neu. Mehrere Pushes werden nacheinander abgearbeitet.
5. Ist die Domain im Tarif schon als normale Website angelegt, muss diese Website vorher entfernt werden, sonst lässt sich die Domain der Web-App nicht zuweisen.

Gut zu wissen:
- Ein GitHub-Account pro Hosting-Tarif, den teilen sich alle Web-Apps darin.
- Installieren und Bauen haben je 15 Minuten Zeit. Die Logs der letzten 10 Builds stehen im Dashboard.
- Umgebungsvariablen (nur falls nötig): im Website-Dashboard unter **Environment variables**, auch per „Import .env“. Werte gibt der Nutzer selbst ein, nie in den Chat.
- Eine Node-Server-App schläft ohne Besucher ein und startet beim nächsten Aufruf neu. Der erste Aufruf kann dann ein paar Sekunden dauern. Bei statisch ausgelieferten Seiten gibt es das nicht. Noch ein Grund für statisch.

## Weg B: GitHub Actions plus FTP (Premium, Single)

Hier kann Hostinger nicht selbst bauen. Das übernimmt GitHub: Bei jedem Push baut eine Action die Seite und lädt `dist/` per FTP in `public_html` hoch. Hochgeladen werden nur geänderte Dateien.

1. **FTP-Zugang holen** (Nutzer): Website-Dashboard → **Dateien → FTP-Konten**. Dort stehen FTP-IP (als Server nehmen), Benutzername und Port 21. Das Passwort wird nie angezeigt. Mit „FTP-Passwort ändern“ ein neues setzen.
2. **Secrets in GitHub anlegen** (Nutzer): Repo → Settings → Secrets and variables → Actions → „New repository secret“:
   - `FTP_SERVER`
   - `FTP_USERNAME`
   - `FTP_PASSWORD`

   Die Werte trägt der Nutzer selbst ein. Du fragst nicht danach und schreibst sie nirgends hin.
3. **Workflow anlegen** (du): `.github/workflows/deploy.yml`

   ```yaml
   name: Deploy to Hostinger
   on:
     push:
       branches: [main]
     workflow_dispatch:
   concurrency:
     group: deploy-hostinger
     cancel-in-progress: false
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v7
         - uses: actions/setup-node@v7
           with:
             node-version: 22
             cache: npm
         - run: npm ci
         - run: npm run build
         - name: Upload dist via FTP
           uses: SamKirkland/FTP-Deploy-Action@v4.4.0
           with:
             server: ${{ secrets.FTP_SERVER }}
             username: ${{ secrets.FTP_USERNAME }}
             password: ${{ secrets.FTP_PASSWORD }}
             protocol: ftp
             port: 21
             local-dir: ./dist/
             server-dir: ./public_html/
   ```

   Versionen der Actions vor dem Commit kurz prüfen (`gh api repos/actions/checkout/releases/latest --jq .tag_name`, ebenso für `actions/setup-node` und `SamKirkland/FTP-Deploy-Action`) und auf die aktuelle Hauptversion setzen.
4. **`server-dir` prüfen:** Je nach FTP-Konto beginnt der Zugang schon in `public_html`. Dann muss `server-dir: ./` heißen. Der Nutzer kann das mit einem FTP-Programm (z. B. FileZilla) einmal nachsehen. Alternativ schaut ihr nach dem ersten Lauf, ob die Dateien in `public_html/public_html/` gelandet sind.
5. Committen, pushen, unter **Actions** im Repo zusehen, wie der erste Lauf durchgeht.
6. Die Platzhalterseite von Hostinger in `public_html` (z. B. `default.php`) vorher löschen, sonst liegt sie neben der neuen `index.html`.

Wenn GitHub Actions für den Nutzer zu viel ist: Bei kleinen Seiten tut es auch der Wechsel auf Unlimited. Dann gilt Weg A.

## Domain und SSL

1. **Domain verbinden:** entweder die Nameserver aus dem hPanel beim Domain-Anbieter eintragen (Websites → Website → „Anleitung prüfen“, die Nameserver stehen dort pro Website), oder beim Anbieter A-Records für `@` und `www` auf die IP aus dem Website-Dashboard setzen. Das wirkt meist nach ein paar Stunden, spätestens nach 48.
2. **SSL:** Website-Dashboard → **Sicherheit → SSL → Installieren** (kostenlos), danach **HTTPS erzwingen** an. Geht erst, wenn die Domain schon auf Hostinger zeigt. Bei Web-Apps kann das Menü anders aussehen. Wenn es dort keinen SSL-Punkt gibt, nach dem Verbinden der Domain prüfen, ob `https://` schon funktioniert.
3. Prüfen: `https://domain.de`, `https://www.domain.de` und `http://domain.de` landen alle auf derselben `https`-Adresse.

## Abschlusstest

1. In Pages CMS einen Text ändern und speichern.
2. Weg A: im hPanel bei der Web-App den neuen Build abwarten. Weg B: im Repo unter Actions.
3. Seite neu laden (ggf. mit Shift), Änderung ist da. Erst dann gilt das Hosting als fertig.
