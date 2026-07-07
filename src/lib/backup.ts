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

export function exportBackup(data: AppData) {
  downloadFile(
    `MusikPunkte_Sicherung_${timestamp()}.json`,
    JSON.stringify(data, null, 2),
    'application/json'
  );
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
