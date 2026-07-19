import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  Button,
  C,
  Card,
  confirmAsync,
  EmptyState,
  Field,
  Row,
  Segmented,
  Sheet,
} from '@/components/ui';
import {
  CARRYOVER_MAX,
  CARRYOVER_MIN,
  carryoverFor,
  defaultSemester,
  filterEntries,
  formatCarryover,
  formatDate,
  formatPoints,
  GRADE_COLORS,
  gradeForPoints,
  gradeScaleText,
  maxTotalPoints,
  parsePoints,
  sumByCategory,
  sumPoints,
  todayIso,
} from '@/lib/grades';
import { useStore } from '@/lib/store';
import type { Entry, Semester } from '@/lib/types';

export default function StudentScreen() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const router = useRouter();
  const { data, addEntry, updateEntry, deleteEntry, updateStudent, deleteStudent } =
    useStore();

  const student = data.students.find((s) => s.id === studentId);
  const cls = data.classes.find((c) => c.id === student?.classId);
  const scheme = data.schemes.find((s) => s.id === cls?.schemeId);

  const [semester, setSemester] = useState<Semester>(defaultSemester());

  // Eintrag anlegen/bearbeiten
  const [showEntry, setShowEntry] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [points, setPoints] = useState('');
  const [date, setDate] = useState(todayIso());
  const [topic, setTopic] = useState('');
  const [entrySemester, setEntrySemester] = useState<Semester>(defaultSemester());

  // Schüler:in bearbeiten
  const [showEditStudent, setShowEditStudent] = useState(false);
  const [editLast, setEditLast] = useState('');
  const [editFirst, setEditFirst] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editCarry, setEditCarry] = useState('');

  const entries = useMemo(() => {
    if (!student) return [];
    return filterEntries(data.entries, student.id, semester).sort((a, b) =>
      b.date.localeCompare(a.date)
    );
  }, [data.entries, student, semester]);

  if (!student || !cls || !scheme) {
    return <EmptyState title="Schüler:in nicht gefunden" />;
  }

  const byCat = sumByCategory(entries);
  const carry = carryoverFor(student, semester);
  const total = sumPoints(entries) + carry;
  const grade = gradeForPoints(scheme, total);

  const openNewEntry = (catId?: string) => {
    setEditingId(null);
    setCategoryId(catId ?? scheme.categories[0]?.id ?? '');
    setPoints('');
    setDate(todayIso());
    setTopic('');
    setEntrySemester(defaultSemester());
    setShowEntry(true);
  };

  const openEditEntry = (entry: Entry) => {
    setEditingId(entry.id);
    setCategoryId(entry.categoryId);
    setPoints(formatPoints(entry.points));
    setDate(entry.date);
    setTopic(entry.topic ?? '');
    setEntrySemester(entry.semester);
    setShowEntry(true);
  };

  const saveEntry = () => {
    const p = parsePoints(points);
    if (p === null) return;
    if (editingId) {
      updateEntry(editingId, {
        categoryId,
        points: p,
        date,
        topic: topic.trim() || undefined,
        semester: entrySemester,
      });
    } else {
      addEntry({
        studentId: student.id,
        categoryId,
        points: p,
        date,
        topic: topic.trim() || undefined,
        semester: entrySemester,
      });
    }
    setShowEntry(false);
  };

  const removeEntry = async () => {
    if (!editingId) return;
    const ok = await confirmAsync('Eintrag löschen?', 'Dieser Punkteeintrag wird entfernt.');
    if (ok) {
      deleteEntry(editingId);
      setShowEntry(false);
    }
  };

  const openEditStudent = () => {
    setEditLast(student.lastName);
    setEditFirst(student.firstName);
    setEditNotes(student.notes ?? '');
    setEditCarry(student.carryover ? formatPoints(student.carryover) : '');
    setShowEditStudent(true);
  };

  const saveStudent = () => {
    const parsedCarry = parsePoints(editCarry);
    const clampedCarry =
      parsedCarry === null
        ? undefined
        : Math.max(CARRYOVER_MIN, Math.min(CARRYOVER_MAX, parsedCarry)) || undefined;
    updateStudent(student.id, {
      lastName: editLast.trim(),
      firstName: editFirst.trim(),
      notes: editNotes.trim() || undefined,
      carryover: clampedCarry,
    });
    setShowEditStudent(false);
  };

  const removeStudent = async () => {
    const ok = await confirmAsync(
      'Schüler:in löschen?',
      `„${student.lastName} ${student.firstName}“ wird mit allen Punkten endgültig gelöscht.`
    );
    if (ok) {
      setShowEditStudent(false);
      router.back();
      deleteStudent(student.id);
    }
  };

  const selectedCategory = scheme.categories.find((c) => c.id === categoryId);
  const fullName = `${student.lastName} ${student.firstName}`.trim();

  return (
    <>
      <Stack.Screen options={{ title: `${fullName} (${cls.name})` }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.inner}>
          <Row style={{ flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 12 }}>
            <Segmented<Semester>
              options={[
                { label: '1. Semester', value: 1 },
                { label: '2. Semester', value: 2 },
              ]}
              value={semester}
              onChange={setSemester}
            />
            <Row>
              <Button title="+ Punkte eintragen" onPress={() => openNewEntry()} small />
              <Button title="⋯" onPress={openEditStudent} small variant="secondary" />
            </Row>
          </Row>

          {/* Übersicht */}
          <Card style={{ marginBottom: 12 }}>
            <Row style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={styles.sumTitle}>
                Punktestand ({semester}. Semester)
              </Text>
              <Row>
                <Text style={styles.totalPoints}>
                  {formatPoints(total)} / {maxTotalPoints(scheme)} P
                </Text>
                <View style={[styles.gradeBadge, { backgroundColor: GRADE_COLORS[grade.value] }]}>
                  <Text style={styles.gradeBadgeText}>
                    {grade.label} ({grade.value})
                  </Text>
                </View>
              </Row>
            </Row>
            {semester === 2 ? (
              <Pressable onPress={openEditStudent}>
                <Row style={{ marginBottom: 10 }}>
                  <Text style={styles.catName}>Übertrag aus 1. Semester</Text>
                  <View style={{ flex: 1 }} />
                  <Text
                    style={[
                      styles.carryValue,
                      carry < 0 && { color: C.danger },
                      carry === 0 && { color: C.textMuted, fontWeight: '400' },
                    ]}
                  >
                    {carry !== 0 ? `${formatCarryover(carry)} P` : 'kein Übertrag'}
                  </Text>
                </Row>
              </Pressable>
            ) : null}
            {scheme.categories.map((cat) => {
              const val = byCat[cat.id] ?? 0;
              const ratio = cat.maxPoints > 0 ? Math.min(val / cat.maxPoints, 1) : 0;
              const over = val > cat.maxPoints;
              return (
                <Pressable key={cat.id} onPress={() => openNewEntry(cat.id)}>
                  <Row style={{ marginBottom: 7 }}>
                    <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${ratio * 100}%` },
                          over && { backgroundColor: C.warn },
                        ]}
                      />
                    </View>
                    <Text style={[styles.catPoints, over && { color: C.warn }]}>
                      {formatPoints(val)} / {cat.maxPoints}
                    </Text>
                  </Row>
                </Pressable>
              );
            })}
            <Text style={styles.tapHint}>
              Tipp: Auf eine Kategorie tippen, um dafür Punkte einzutragen.
            </Text>
          </Card>

          {/* Einträge */}
          <Text style={styles.sectionTitle}>Einträge</Text>
          {entries.length === 0 ? (
            <EmptyState
              title="Noch keine Einträge"
              hint="Mit „+ Punkte eintragen“ den ersten Eintrag anlegen."
            />
          ) : (
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              {entries.map((entry, idx) => {
                const cat = scheme.categories.find((c) => c.id === entry.categoryId);
                return (
                  <Pressable key={entry.id} onPress={() => openEditEntry(entry)}>
                    {({ pressed }) => (
                      <Row
                        style={[
                          styles.entryRow,
                          idx % 2 === 1 && { backgroundColor: '#f7fafb' },
                          pressed && { backgroundColor: C.primaryLight },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.entryCat}>
                            {cat?.name ?? 'Unbekannte Kategorie'}
                            {entry.topic ? ` – ${entry.topic}` : ''}
                          </Text>
                          <Text style={styles.entryMeta}>
                            {formatDate(entry.date)} · {entry.semester}. Semester
                          </Text>
                        </View>
                        <Text style={styles.entryPoints}>{formatPoints(entry.points)} P</Text>
                      </Row>
                    )}
                  </Pressable>
                );
              })}
            </Card>
          )}

          {student.notes ? (
            <>
              <Text style={styles.sectionTitle}>Notizen</Text>
              <Card>
                <Text style={{ fontSize: 14, color: C.text, lineHeight: 20 }}>
                  {student.notes}
                </Text>
              </Card>
            </>
          ) : null}
        </View>
      </ScrollView>

      {/* Eintrag anlegen / bearbeiten */}
      <Sheet
        visible={showEntry}
        title={editingId ? 'Eintrag bearbeiten' : 'Punkte eintragen'}
        onClose={() => setShowEntry(false)}
      >
        <Text style={styles.fieldLabel}>Kategorie</Text>
        <Row style={{ flexWrap: 'wrap', marginBottom: 12 }}>
          {scheme.categories.map((cat) => {
            const active = cat.id === categoryId;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setCategoryId(cat.id)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </Row>
        {selectedCategory?.hint ? (
          <Text style={styles.hint}>{selectedCategory.hint}</Text>
        ) : null}
        <Field
          label={`Punkte${selectedCategory ? ` (max. ${selectedCategory.maxPoints})` : ''}`}
          value={points}
          onChangeText={setPoints}
          keyboardType="decimal-pad"
          autoFocus
        />
        <Field
          label="Was wurde geprüft? (optional)"
          value={topic}
          onChangeText={setTopic}
          placeholder="z. B. WH Notenlehre"
        />
        <Field label="Datum" value={date} onChangeText={setDate} placeholder="JJJJ-MM-TT" />
        <Text style={styles.fieldLabel}>Semester</Text>
        <Segmented<Semester>
          options={[
            { label: '1. Semester', value: 1 },
            { label: '2. Semester', value: 2 },
          ]}
          value={entrySemester}
          onChange={setEntrySemester}
        />
        <Text style={styles.scaleInfo}>
          Notenschlüssel: {gradeScaleText(scheme)}
        </Text>
        <View style={{ marginTop: 18 }}>
          <Button
            title="Speichern"
            onPress={saveEntry}
            disabled={parsePoints(points) === null}
          />
        </View>
        {editingId ? (
          <View style={{ marginTop: 18 }}>
            <Button title="Eintrag löschen …" variant="danger" onPress={removeEntry} />
          </View>
        ) : null}
      </Sheet>

      {/* Schüler:in bearbeiten */}
      <Sheet
        visible={showEditStudent}
        title="Schüler:in bearbeiten"
        onClose={() => setShowEditStudent(false)}
      >
        <Field label="Nachname" value={editLast} onChangeText={setEditLast} />
        <Field label="Vorname" value={editFirst} onChangeText={setEditFirst} />
        <Field
          label={`Übertrag ins 2. Semester (${CARRYOVER_MIN} bis +${CARRYOVER_MAX} P)`}
          value={editCarry}
          onChangeText={setEditCarry}
          placeholder="z. B. -2 oder 5"
        />
        <Text style={styles.carryHint}>
          Zählt zusätzlich zu den Punkten des 2. Semesters: negativ, wenn im
          1. Semester Punkte für die bessere Note vorgestreckt wurden; positiv,
          wenn Punkte über dem Maximum mitgenommen werden.
        </Text>
        <Field
          label="Notizen (optional)"
          value={editNotes}
          onChangeText={setEditNotes}
          multiline
          numberOfLines={4}
          style={{ minHeight: 90, textAlignVertical: 'top' }}
        />
        <Button title="Speichern" onPress={saveStudent} />
        <View style={{ height: 24 }} />
        <Button title="Schüler:in löschen …" variant="danger" onPress={removeStudent} />
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: 'center' },
  inner: { width: '100%', maxWidth: 800 },
  sumTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  totalPoints: { fontSize: 16, fontWeight: '700', color: C.primaryDark },
  gradeBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  gradeBadgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  catName: { width: 170, fontSize: 13.5, color: C.text },
  barTrack: {
    flex: 1,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#e6ebef',
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 5, backgroundColor: C.primary },
  catPoints: { width: 80, textAlign: 'right', fontSize: 13, color: C.textMuted },
  tapHint: { fontSize: 12, color: C.textMuted, marginTop: 8, fontStyle: 'italic' },
  carryValue: { fontSize: 13.5, fontWeight: '700', color: C.primaryDark },
  carryHint: {
    fontSize: 12,
    color: C.textMuted,
    lineHeight: 17,
    marginTop: -6,
    marginBottom: 12,
  },
  scaleInfo: {
    fontSize: 12.5,
    color: C.primaryDark,
    marginTop: 12,
    lineHeight: 18,
    backgroundColor: C.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    marginTop: 8,
    marginBottom: 8,
  },
  entryRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eef1f4',
  },
  entryCat: { fontSize: 14.5, fontWeight: '600', color: C.text },
  entryMeta: { fontSize: 12.5, color: C.textMuted, marginTop: 2 },
  entryPoints: { fontSize: 15, fontWeight: '700', color: C.primaryDark },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: C.textMuted, marginBottom: 6 },
  hint: { fontSize: 13, color: C.textMuted, marginBottom: 10, fontStyle: 'italic' },
  chip: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#fff',
    marginBottom: 6,
  },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 13, color: C.text },
  chipTextActive: { color: '#fff', fontWeight: '600' },
});
