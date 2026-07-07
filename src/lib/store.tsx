import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { newId } from './id';
import { DEFAULT_SCHEMES } from './schemes';
import type { AppData, Entry, SchoolClass, Student } from './types';

const STORAGE_KEY = 'musikpunkte.data.v1';

function emptyData(): AppData {
  return {
    version: 1,
    classes: [],
    students: [],
    entries: [],
    schemes: DEFAULT_SCHEMES,
  };
}

// Stellt sicher, dass geladene/importierte Daten vollständig sind
export function normalizeData(raw: unknown): AppData {
  const base = emptyData();
  if (!raw || typeof raw !== 'object') return base;
  const d = raw as Partial<AppData>;
  return {
    version: 1,
    classes: Array.isArray(d.classes) ? d.classes : [],
    students: Array.isArray(d.students) ? d.students : [],
    entries: Array.isArray(d.entries) ? d.entries : [],
    schemes:
      Array.isArray(d.schemes) && d.schemes.length > 0
        ? d.schemes
        : DEFAULT_SCHEMES,
  };
}

type StoreContextValue = {
  data: AppData;
  loaded: boolean;
  addClass: (name: string, schoolYear: string, schemeId: string) => SchoolClass;
  updateClass: (id: string, patch: Partial<SchoolClass>) => void;
  deleteClass: (id: string) => void;
  addStudent: (classId: string, lastName: string, firstName: string) => Student;
  updateStudent: (id: string, patch: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  addEntry: (entry: Omit<Entry, 'id'>) => Entry;
  updateEntry: (id: string, patch: Partial<Entry>) => void;
  deleteEntry: (id: string) => void;
  replaceAll: (data: AppData) => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) setData(normalizeData(JSON.parse(json)));
      } catch (e) {
        console.warn('Konnte gespeicherte Daten nicht laden', e);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch((e) =>
        console.warn('Speichern fehlgeschlagen', e)
      );
    }, 200);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [data, loaded]);

  const addClass = useCallback(
    (name: string, schoolYear: string, schemeId: string) => {
      const cls: SchoolClass = { id: newId(), name, schoolYear, schemeId };
      setData((d) => ({ ...d, classes: [...d.classes, cls] }));
      return cls;
    },
    []
  );

  const updateClass = useCallback((id: string, patch: Partial<SchoolClass>) => {
    setData((d) => ({
      ...d,
      classes: d.classes.map((c) => (c.id === id ? { ...c, ...patch, id } : c)),
    }));
  }, []);

  const deleteClass = useCallback((id: string) => {
    setData((d) => {
      const studentIds = new Set(
        d.students.filter((s) => s.classId === id).map((s) => s.id)
      );
      return {
        ...d,
        classes: d.classes.filter((c) => c.id !== id),
        students: d.students.filter((s) => s.classId !== id),
        entries: d.entries.filter((e) => !studentIds.has(e.studentId)),
      };
    });
  }, []);

  const addStudent = useCallback(
    (classId: string, lastName: string, firstName: string) => {
      const student: Student = { id: newId(), classId, lastName, firstName };
      setData((d) => ({ ...d, students: [...d.students, student] }));
      return student;
    },
    []
  );

  const updateStudent = useCallback((id: string, patch: Partial<Student>) => {
    setData((d) => ({
      ...d,
      students: d.students.map((s) => (s.id === id ? { ...s, ...patch, id } : s)),
    }));
  }, []);

  const deleteStudent = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      students: d.students.filter((s) => s.id !== id),
      entries: d.entries.filter((e) => e.studentId !== id),
    }));
  }, []);

  const addEntry = useCallback((entry: Omit<Entry, 'id'>) => {
    const full: Entry = { ...entry, id: newId() };
    setData((d) => ({ ...d, entries: [...d.entries, full] }));
    return full;
  }, []);

  const updateEntry = useCallback((id: string, patch: Partial<Entry>) => {
    setData((d) => ({
      ...d,
      entries: d.entries.map((e) => (e.id === id ? { ...e, ...patch, id } : e)),
    }));
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setData((d) => ({ ...d, entries: d.entries.filter((e) => e.id !== id) }));
  }, []);

  const replaceAll = useCallback((next: AppData) => {
    setData(normalizeData(next));
  }, []);

  const value: StoreContextValue = {
    data,
    loaded,
    addClass,
    updateClass,
    deleteClass,
    addStudent,
    updateStudent,
    deleteStudent,
    addEntry,
    updateEntry,
    deleteEntry,
    replaceAll,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore muss innerhalb von StoreProvider verwendet werden');
  return ctx;
}

export function sortStudents(students: Student[]): Student[] {
  return [...students].sort((a, b) =>
    (a.lastName + ' ' + a.firstName).localeCompare(
      b.lastName + ' ' + b.firstName,
      'de'
    )
  );
}
