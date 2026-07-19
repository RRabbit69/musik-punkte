import { Platform } from 'react-native';

import { normalizeData } from './store';
import type { AppData } from './types';

function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}`;
}

function downloadFile(filename: string, content: string, mime: string) {
  if (Platform.OS !== 'web') {
    throw new Error('Export ist derzeit nur in der Web-Version verfügbar.');
  }
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function isIosLike(): boolean {
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes('Macintosh') && navigator.maxTouchPoints > 1) // iPadOS
  );
}

// Liefert true, wenn die Sicherung (sehr wahrscheinlich) gespeichert wurde,
// false bei Abbruch durch die Nutzerin.
export async function exportBackup(data: AppData): Promise<boolean> {
  const filename = `MusikPunkte_Sicherung_${timestamp()}.json`;
  const json = JSON.stringify(data, null, 2);
  if (Platform.OS !== 'web') {
    throw new Error('Export ist derzeit nur in der Web-Version verfügbar.');
  }
  // Auf iPhone/iPad das Teilen-Menü nutzen: dort kann direkt
  // "In Dateien sichern" (z. B. iCloud Drive) gewählt werden.
  if (isIosLike() && 'share' in navigator && 'canShare' in navigator) {
    const file = new File([json], filename, { type: 'application/json' });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        return true;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return false; // abgebrochen
        // sonst auf normalen Download zurückfallen
      }
    }
  }
  downloadFile(filename, json, 'application/json');
  return true;
}

export function daysSinceBackup(lastBackup: string | null): number | null {
  if (!lastBackup) return null;
  const then = new Date(lastBackup).getTime();
  if (!Number.isFinite(then)) return null;
  return Math.max(0, Math.floor((Date.now() - then) / 86400000));
}

export function backupAgeLabel(lastBackup: string | null): string {
  const days = daysSinceBackup(lastBackup);
  if (days === null) return 'noch nie';
  if (days === 0) return 'heute';
  if (days === 1) return 'gestern';
  return `vor ${days} Tagen`;
}

export function exportCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const needsQuotes = /[";\n]/.test(cell);
          const escaped = cell.replace(/"/g, '""');
          return needsQuotes ? `"${escaped}"` : escaped;
        })
        .join(';')
    )
    .join('\r\n');
  // BOM, damit Excel Umlaute korrekt anzeigt
  downloadFile(filename, '﻿' + csv, 'text/csv;charset=utf-8');
}

export function pickBackupFile(): Promise<AppData | null> {
  if (Platform.OS !== 'web') {
    return Promise.reject(
      new Error('Import ist derzeit nur in der Web-Version verfügbar.')
    );
  }
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          resolve(normalizeData(parsed));
        } catch {
          reject(new Error('Die Datei ist keine gültige Sicherungsdatei.'));
        }
      };
      reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'));
      reader.readAsText(file);
    };
    input.click();
  });
}
