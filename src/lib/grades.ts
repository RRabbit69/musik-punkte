import type { Entry, GradeStep, Scheme, Semester, Student } from './types';

export function filterEntries(
  entries: Entry[],
  studentId: string,
  semester: Semester
): Entry[] {
  return entries.filter(
    (e) => e.studentId === studentId && e.semester === semester
  );
}

// Punkte über der "Sehr gut"-Grenze des 1. Semesters, gedeckelt auf +5
export function autoCarryover(scheme: Scheme, sem1Total: number): number {
  const sehrGutMin = Math.max(...scheme.gradeSteps.map((s) => s.min));
  return Math.min(CARRYOVER_MAX, Math.max(0, sem1Total - sehrGutMin));
}

// Übertrag aus dem 1. Semester: zählt nur im 2. Semester.
// Manuell gesetzter Wert überschreibt die Automatik.
export function carryoverFor(
  student: Student,
  scheme: Scheme,
  sem1Total: number,
  semester: Semester
): number {
  if (semester !== 2) return 0;
  if (typeof student.carryover === 'number') return student.carryover;
  return autoCarryover(scheme, sem1Total);
}

export const CARRYOVER_MIN = -5;
export const CARRYOVER_MAX = 5;

export function formatCarryover(value: number): string {
  return (value > 0 ? '+' : '') + formatPoints(value);
}

export function gradeScaleText(scheme: Scheme): string {
  return [...scheme.gradeSteps]
    .sort((a, b) => b.min - a.min)
    .map((s) => `${s.label} ab ${s.min} P`)
    .join(' · ');
}

export function sumPoints(entries: Entry[]): number {
  return entries.reduce((sum, e) => sum + e.points, 0);
}

export function sumByCategory(entries: Entry[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const e of entries) {
    result[e.categoryId] = (result[e.categoryId] ?? 0) + e.points;
  }
  return result;
}

export function gradeForPoints(scheme: Scheme, points: number): GradeStep {
  const steps = [...scheme.gradeSteps].sort((a, b) => b.min - a.min);
  for (const step of steps) {
    if (points >= step.min) return step;
  }
  return steps[steps.length - 1];
}

export function maxTotalPoints(scheme: Scheme): number {
  return scheme.categories.reduce((sum, c) => sum + c.maxPoints, 0);
}

export const GRADE_COLORS: Record<number, string> = {
  1: '#15803d',
  2: '#65a30d',
  3: '#ca8a04',
  4: '#ea580c',
  5: '#dc2626',
};

export function formatPoints(points: number): string {
  const rounded = Math.round(points * 100) / 100;
  return String(rounded).replace('.', ',');
}

export function parsePoints(text: string): number | null {
  const trimmed = text.trim().replace(',', '.');
  if (trimmed === '') return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100) / 100;
}

export function todayIso(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}

// Standard-Semester anhand des Datums: Sept–Jan = 1, Feb–Aug = 2
export function defaultSemester(): Semester {
  const month = new Date().getMonth() + 1;
  return month >= 2 && month <= 8 ? 2 : 1;
}
