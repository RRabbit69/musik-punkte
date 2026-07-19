# Musik-Punkte – Anleitung

App zum Erfassen der Musik-Punkte nach dem Punktesystem (6. Klasse bzw. 7./8. Klasse).

## Starten am eigenen PC (Entwicklung)

Voraussetzung: Node.js ist installiert.

```
cd MusikPunkte
npm run web
```

Danach öffnet sich die App im Browser unter http://localhost:8081

## Bedienung in Kürze

1. **Klasse anlegen** – Startseite → „+ Neue Klasse“, Punkteschema wählen
   (6. Klasse oder 7./8. Klasse).
2. **Schüler:innen hinzufügen** – in der Klasse → „+ Schüler:innen“.
   Entweder einzeln oder als ganze Liste (eine Zeile pro Person,
   Format „Nachname Vorname“).
3. **Punkte für die ganze Klasse eintragen** – „Punkte eintragen“:
   Kategorie, Datum, Thema und Semester wählen, dann pro Schüler:in
   die Punkte eingeben. Leere Felder werden übersprungen.
4. **Einzelne Schüler:in** – in der Tabelle auf die Zeile klicken:
   dort sieht man alle Einträge, den Punktestand pro Kategorie und die
   aktuelle Note. Ein Klick auf eine Kategorie trägt dafür Punkte ein,
   ein Klick auf einen Eintrag bearbeitet oder löscht ihn.
5. **Note** – wird automatisch aus den Punkten des gewählten Semesters
   laut Punktetabelle berechnet (umschaltbar: 1. / 2. Semester).
   **Übertrag:** Pro Schüler:in können −5 bis +5 Punkte ins 2. Semester
   mitgenommen werden (einstellbar in der Schüleransicht über „⋯“).
   Der Übertrag zählt automatisch zum Punktestand des 2. Semesters.
6. **CSV** – exportiert die Klassenliste für Excel.
7. **Sicherung** (oben rechts auf der Startseite) – Daten als Datei
   sichern und auf einem anderen Gerät (z. B. Mac) wieder laden.

## Wichtig: Datenschutz und Datensicherung

- Alle Daten bleiben **nur im Browser dieses Geräts** gespeichert.
  Es wird nichts ins Internet übertragen.
- Regelmäßig über „Sicherung“ eine Sicherungsdatei erstellen!
  Beim Leeren der Browserdaten gehen die App-Daten sonst verloren.

## Online-Adresse (installierbare Web-App)

Die App ist als PWA veröffentlicht (nur der Programmcode – keine Daten):

**https://rrabbit69.github.io/musik-punkte/**

Installation: Link in Chrome/Edge (PC) bzw. Chrome/Safari (Mac) öffnen
→ „App installieren“ in der Adressleiste (Safari: Teilen → „Zum Dock
hinzufügen“). Danach eigenes App-Symbol, läuft auch offline.

## Neue Version veröffentlichen (nach Code-Änderungen)

Am einfachsten das Skript `deploy.ps1` verwenden (macht alle Schritte
unten automatisch). Manuell – wichtig: `expo export` löscht `dist`
samt `.git`, daher muss dort jedes Mal neu initialisiert werden:

```powershell
cd MusikPunkte
npx expo export --platform web
Copy-Item dist\index.html dist\404.html -Force
New-Item -ItemType File dist\.nojekyll -Force
git -C dist init -b gh-pages
git -C dist add -A
git -C dist commit -m "Deploy"
git -C dist push -f https://github.com/RRabbit69/musik-punkte.git gh-pages
```

Quellcode-Repository: https://github.com/RRabbit69/musik-punkte
(Änderungen am Code zusätzlich normal committen und auf `main` pushen.)

## Später möglich

- Android-/iOS-Version über Expo (gleicher Code).
