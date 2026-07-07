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
5. **Note** – wird automatisch aus den Gesamtpunkten laut Punktetabelle
   berechnet (umschaltbar: 1. Semester / 2. Semester / Gesamtjahr).
6. **CSV** – exportiert die Klassenliste für Excel.
7. **Sicherung** (oben rechts auf der Startseite) – Daten als Datei
   sichern und auf einem anderen Gerät (z. B. Mac) wieder laden.

## Wichtig: Datenschutz und Datensicherung

- Alle Daten bleiben **nur im Browser dieses Geräts** gespeichert.
  Es wird nichts ins Internet übertragen.
- Regelmäßig über „Sicherung“ eine Sicherungsdatei erstellen!
  Beim Leeren der Browserdaten gehen die App-Daten sonst verloren.

## Nächste Schritte (geplant)

- Bereitstellung als installierbare Web-App (PWA) über einen Link,
  damit die App auf PC und Mac ohne Installation genutzt werden kann.
- Später: Android-/iOS-Version über Expo (gleicher Code).
