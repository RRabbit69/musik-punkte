import type { Scheme } from './types';

// Punkteschemata laut den PDFs "Punktesystem Musik"

const commonCategories = [
  {
    id: 'schriftliche-checks',
    name: 'Schriftliche Checks',
    shortName: 'Schr. Checks',
    maxPoints: 20,
  },
  {
    id: 'muendliche-checks',
    name: 'Mündliche Checks',
    shortName: 'Mündl. Checks',
    maxPoints: 10,
  },
  {
    id: 'praesentation',
    name: 'Präsentation',
    shortName: 'Präsent.',
    maxPoints: 20,
    hint: 'Thema passend zum aktuellen Unterricht, 10–15 Minuten',
  },
  {
    id: 'musikpraktische-uebungen',
    name: 'Musikpraktische Übungen',
    shortName: 'Übungen',
    maxPoints: 5,
  },
  {
    id: 'konzertbesuch',
    name: 'Konzert-/Opern-/Musicalbesuch',
    shortName: 'Konzert',
    maxPoints: 10,
    hint: 'Besuch eines klassischen Konzertes/einer Oper/eines Musicals inkl. kurzem mündlichem Bericht',
  },
  {
    id: 'mitarbeit',
    name: 'Mitarbeit',
    shortName: 'Mitarbeit',
    maxPoints: 30,
    hint: 'Aufzeigen, Unterrichtsmaterialien mithaben, aktiv mitarbeiten/mitsingen, kein Tratschen',
  },
];

export const DEFAULT_SCHEMES: Scheme[] = [
  {
    id: 'klasse-6',
    name: '6. Klasse',
    categories: [...commonCategories],
    gradeSteps: [
      { label: 'Sehr gut', value: 1, min: 65 },
      { label: 'Gut', value: 2, min: 50 },
      { label: 'Befriedigend', value: 3, min: 35 },
      { label: 'Genügend', value: 4, min: 20 },
      { label: 'Nicht genügend', value: 5, min: 0 },
    ],
  },
  {
    id: 'klasse-7-8',
    name: '7./8. Klasse',
    categories: [
      {
        id: 'mini-aba',
        name: 'Mini-AbA',
        shortName: 'Mini-AbA',
        maxPoints: 30,
        hint: 'Thema frei wählbar, 7–10 Seiten',
      },
      ...commonCategories,
    ],
    gradeSteps: [
      { label: 'Sehr gut', value: 1, min: 85 },
      { label: 'Gut', value: 2, min: 70 },
      { label: 'Befriedigend', value: 3, min: 55 },
      { label: 'Genügend', value: 4, min: 40 },
      { label: 'Nicht genügend', value: 5, min: 0 },
    ],
  },
];
