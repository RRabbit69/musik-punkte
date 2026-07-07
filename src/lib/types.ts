// Datenmodell der Musik-Punkte-App

export type CategoryDef = {
  id: string;
  name: string;
  shortName: string;
  maxPoints: number;
  hint?: string;
};

export type GradeStep = {
  label: string; // z. B. "Sehr gut"
  value: 1 | 2 | 3 | 4 | 5;
  min: number; // Mindestpunkte für diese Note
};

export type Scheme = {
  id: string;
  name: string; // z. B. "6. Klasse"
  categories: CategoryDef[];
  // absteigend sortiert nach min; letzter Eintrag hat min 0
  gradeSteps: GradeStep[];
};

export type SchoolClass = {
  id: string;
  name: string; // z. B. "8BC"
  schoolYear: string; // z. B. "2025/26"
  schemeId: string;
};

export type Student = {
  id: string;
  classId: string;
  lastName: string;
  firstName: string;
  notes?: string;
};

export type Semester = 1 | 2;

export type Entry = {
  id: string;
  studentId: string;
  categoryId: string;
  date: string; // ISO yyyy-mm-dd
  points: number;
  semester: Semester;
  topic?: string; // was geprüft wurde
};

export type AppData = {
  version: 1;
  classes: SchoolClass[];
  students: Student[];
  entries: Entry[];
  schemes: Scheme[];
};
