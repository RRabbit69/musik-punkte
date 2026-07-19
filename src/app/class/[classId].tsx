import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  Button,
  C,
  Card,
  ColorPicker,
  confirmAsync,
  EmptyState,
  Field,
  notify,
  Row,
  Segmented,
  Sheet,
} from '@/components/ui';
import { exportCsv } from '@/lib/backup';
import {
  carryoverFor,
  defaultSemester,
  filterEntries,
  formatCarryover,
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
import { sortStudents, useStore } from '@/lib/store';
import type { Semester } from '@/lib/types';

export default function ClassScreen() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const router = useRouter();
  const {
    data,
    addStudent,
    addEntry,
    updateClass,
    deleteClass,
  } = useStore();

  const cls = data.classes.find((c) => c.id === classId);
  const scheme = data.schemes.find((s) => s.id === cls?.schemeId);
  const students = useMemo(
    () => sortStudents(data.students.filter((s) => s.classId === classId)),
    [data.students, classId]
  );

  const [semester, setSemester] = useState<Semester>(defaultSemester());

  // Schüler:innen hinzufügen
  const [showAddStudents, setShowAddStudents] = useState(false);
  const [addMode, setAddMode] = useState<'single' | 'list'>('single');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [nameList, setNameList] = useState('');

  // Punkte eintragen (mehrere Schüler:innen auf einmal)
  const [showBulk, setShowBulk] = useState(false);
  const [bulkCategoryId, setBulkCategoryId] = useState('');
  const [bulkDate, setBulkDate] = useState(todayIso());
  const [bulkTopic, setBulkTopic] = useState('');
  const [bulkSemester, setBulkSemester] = useState<Semester>(defaultSemester());
  const [bulkPoints, setBulkPoints] = useState<Record<string, string>>({});

  // Klasse bearbeiten
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editColor, setEditColor] = useState<string | undefined>(undefined);

  if (!cls || !scheme) {
    return <EmptyState title="Klasse nicht gefunden" />;
  }

  const saveSingleStudent = (closeAfter: boolean) => {
    const ln = lastName.trim();
    const fn = firstName.trim();
    if (!ln && !fn) return;
    addStudent(cls.id, ln, fn);
    setLastName('');
    setFirstName('');
    if (closeAfter) setShowAddStudents(false);
  };

  const saveNameList = () => {
    const lines = nameList
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    for (const line of lines) {
      const parts = line.split(/\s+/);
      if (parts.length === 1) {
        addStudent(cls.id, parts[0], '');
      } else {
        const fn = parts[parts.length - 1];
        const ln = parts.slice(0, -1).join(' ');
        addStudent(cls.id, ln, fn);
      }
    }
    setNameList('');
    setShowAddStudents(false);
  };

  const openBulk = () => {
    setBulkCategoryId(scheme.categories[0]?.id ?? '');
    setBulkDate(todayIso());
    setBulkTopic('');
    setBulkSemester(defaultSemester());
    setBulkPoints({});
    setShowBulk(true);
  };

  const saveBulk = () => {
    for (const student of students) {
      const points = parsePoints(bulkPoints[student.id] ?? '');
      if (points === null) continue;
      addEntry({
        studentId: student.id,
        categoryId: bulkCategoryId,
        date: bulkDate,
        points,
        semester: bulkSemester,
        topic: bulkTopic.trim() || undefined,
      });
    }
    setShowBulk(false);
  };

  const doExportCsv = () => {
    const rows: string[][] = [];
    rows.push([
      'Name',
      'Gesamt',
      'Note',
      ...(semester === 2 ? ['Übertrag aus 1. Sem.'] : []),
      ...scheme.categories.map((c) => `${c.name} (max. ${c.maxPoints})`),
    ]);
    for (const student of students) {
      const entries = filterEntries(data.entries, student.id, semester);
      const byCat = sumByCategory(entries);
      const sem1Total = sumPoints(filterEntries(data.entries, student.id, 1));
      const carry = carryoverFor(student, scheme, sem1Total, semester);
      const total = sumPoints(entries) + carry;
      const grade = gradeForPoints(scheme, total);
      rows.push([
        `${student.lastName} ${student.firstName}`.trim(),
        formatPoints(total),
        `${grade.label} (${grade.value})`,
        ...(semester === 2 ? [carry !== 0 ? formatCarryover(carry) : ''] : []),
        ...scheme.categories.map((c) =>
          byCat[c.id] !== undefined ? formatPoints(byCat[c.id]) : ''
        ),
      ]);
    }
    try {
      exportCsv(
        `${cls.name}_${cls.schoolYear.replace('/', '-')}_Semester${semester}.csv`,
        rows
      );
    } catch (e) {
      notify('Export nicht möglich', String((e as Error).message));
    }
  };

  const openEdit = () => {
    setEditName(cls.name);
    setEditYear(cls.schoolYear);
    setEditColor(cls.color);
    setShowEdit(true);
  };

  const saveEdit = () => {
    updateClass(cls.id, {
      name: editName.trim(),
      schoolYear: editYear.trim(),
      color: editColor,
    });
    setShowEdit(false);
  };

  const toggleArchive = () => {
    updateClass(cls.id, { archived: !cls.archived });
    setShowEdit(false);
  };

  const removeClass = async () => {
    const ok = await confirmAsync(
      'Klasse löschen?',
      `Die Klasse „${cls.name}“ wird mit allen Schüler:innen und Punkten endgültig gelöscht.`
    );
    if (ok) {
      setShowEdit(false);
      router.back();
      deleteClass(cls.id);
    }
  };

  const bulkCategory = scheme.categories.find((c) => c.id === bulkCategoryId);

  return (
    <>
      <Stack.Screen options={{ title: `${cls.name} · ${cls.schoolYear}` }} />
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
            <Row style={{ flexWrap: 'wrap' }}>
              <Button title="Punkte eintragen" onPress={openBulk} small disabled={students.length === 0} />
              <Button title="+ Schüler:innen" onPress={() => setShowAddStudents(true)} small variant="secondary" />
              <Button title="CSV" onPress={doExportCsv} small variant="secondary" disabled={students.length === 0} />
              <Button title="⋯" onPress={openEdit} small variant="secondary" />
            </Row>
          </Row>

          {students.length === 0 ? (
            <EmptyState
              title="Noch keine Schüler:innen"
              hint="Füge über „+ Schüler:innen“ die Klasse hinzu – einzeln oder als ganze Liste (eine Zeile pro Person)."
            />
          ) : (
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <ScrollView horizontal showsHorizontalScrollIndicator>
                <View>
                  {/* Kopfzeile */}
                  <Row style={[styles.tr, styles.thead]}>
                    <Text style={[styles.nameCell, styles.th]}>Name</Text>
                    <View style={styles.pointCell}>
                      <Text style={styles.th}>Gesamt</Text>
                      <Text style={styles.thMax}>max. {maxTotalPoints(scheme)}</Text>
                    </View>
                    <Text style={[styles.gradeCell, styles.th]}>Note</Text>
                    {semester === 2 ? (
                      <View style={styles.pointCell}>
                        <Text style={styles.th}>Übertrag</Text>
                        <Text style={styles.thMax}>aus 1. Sem.</Text>
                      </View>
                    ) : null}
                    {scheme.categories.map((cat) => (
                      <View key={cat.id} style={styles.pointCell}>
                        <Text style={styles.th} numberOfLines={1}>{cat.shortName}</Text>
                        <Text style={styles.thMax}>max. {cat.maxPoints}</Text>
                      </View>
                    ))}
                  </Row>

                  {students.map((student, idx) => {
                    const entries = filterEntries(data.entries, student.id, semester);
                    const byCat = sumByCategory(entries);
                    const sem1Total = sumPoints(filterEntries(data.entries, student.id, 1));
                    const carry = carryoverFor(student, scheme, sem1Total, semester);
                    const total = sumPoints(entries) + carry;
                    const grade = gradeForPoints(scheme, total);
                    return (
                      <Pressable
                        key={student.id}
                        onPress={() =>
                          router.push({
                            pathname: '/student/[studentId]',
                            params: { studentId: student.id },
                          })
                        }
                      >
                        {({ pressed }) => (
                          <Row
                            style={[
                              styles.tr,
                              idx % 2 === 1 && { backgroundColor: '#f7fafb' },
                              pressed && { backgroundColor: C.primaryLight },
                            ]}
                          >
                            <Text style={[styles.nameCell, styles.name]} numberOfLines={1}>
                              {student.lastName} {student.firstName}
                            </Text>
                            <Text style={[styles.pointCell, styles.points, styles.total]}>
                              {formatPoints(total)}
                            </Text>
                            <View style={styles.gradeCell}>
                              <View
                                style={[
                                  styles.gradeBadge,
                                  { backgroundColor: GRADE_COLORS[grade.value] },
                                ]}
                              >
                                <Text style={styles.gradeText}>{grade.value}</Text>
                              </View>
                            </View>
                            {semester === 2 ? (
                              <Text style={[styles.pointCell, styles.points]}>
                                {carry !== 0 ? formatCarryover(carry) : '–'}
                              </Text>
                            ) : null}
                            {scheme.categories.map((cat) => {
                              const val = byCat[cat.id];
                              const over = val !== undefined && val > cat.maxPoints;
                              return (
                                <Text
                                  key={cat.id}
                                  style={[
                                    styles.pointCell,
                                    styles.points,
                                    over && { color: C.warn, fontWeight: '700' },
                                  ]}
                                >
                                  {val !== undefined ? formatPoints(val) : '–'}
                                </Text>
                              );
                            })}
                          </Row>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </Card>
          )}

          <Text style={styles.legend}>
            Notenschlüssel ({scheme.name}): {gradeScaleText(scheme)}
          </Text>
        </View>
      </ScrollView>

      {/* Schüler:innen hinzufügen */}
      <Sheet
        visible={showAddStudents}
        title="Schüler:innen hinzufügen"
        onClose={() => setShowAddStudents(false)}
      >
        <Segmented
          options={[
            { label: 'Einzeln', value: 'single' },
            { label: 'Ganze Liste', value: 'list' },
          ]}
          value={addMode}
          onChange={setAddMode}
        />
        <View style={{ height: 16 }} />
        {addMode === 'single' ? (
          <>
            <Field label="Nachname" value={lastName} onChangeText={setLastName} autoFocus />
            <Field label="Vorname" value={firstName} onChangeText={setFirstName} />
            <Row>
              <Button
                title="Speichern + weitere"
                onPress={() => saveSingleStudent(false)}
                disabled={!lastName.trim() && !firstName.trim()}
              />
              <Button
                title="Speichern + fertig"
                variant="secondary"
                onPress={() => saveSingleStudent(true)}
                disabled={!lastName.trim() && !firstName.trim()}
              />
            </Row>
          </>
        ) : (
          <>
            <Field
              label={'Eine Person pro Zeile: „Nachname Vorname“'}
              value={nameList}
              onChangeText={setNameList}
              multiline
              numberOfLines={10}
              style={{ minHeight: 180, textAlignVertical: 'top' }}
              placeholder={'Mustermann Max\nMusterfrau Mia'}
            />
            <Button title="Alle hinzufügen" onPress={saveNameList} disabled={!nameList.trim()} />
          </>
        )}
      </Sheet>

      {/* Punkte für mehrere eintragen */}
      <Sheet
        visible={showBulk}
        title="Punkte eintragen"
        onClose={() => setShowBulk(false)}
        wide
      >
        <Text style={styles.fieldLabel}>Kategorie</Text>
        <Row style={{ flexWrap: 'wrap', marginBottom: 12 }}>
          {scheme.categories.map((cat) => {
            const active = cat.id === bulkCategoryId;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setBulkCategoryId(cat.id)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {cat.name} · {cat.maxPoints} P
                </Text>
              </Pressable>
            );
          })}
        </Row>
        {bulkCategory?.hint ? (
          <Text style={styles.hint}>{bulkCategory.hint}</Text>
        ) : null}
        <Row style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, minWidth: 140 }}>
            <Field label="Datum" value={bulkDate} onChangeText={setBulkDate} placeholder="JJJJ-MM-TT" />
          </View>
          <View style={{ flex: 2, minWidth: 180 }}>
            <Field
              label="Was wurde geprüft? (optional)"
              value={bulkTopic}
              onChangeText={setBulkTopic}
              placeholder="z. B. WH Barockmusik"
            />
          </View>
        </Row>
        <Text style={styles.fieldLabel}>Semester</Text>
        <Segmented<Semester>
          options={[
            { label: '1. Semester', value: 1 },
            { label: '2. Semester', value: 2 },
          ]}
          value={bulkSemester}
          onChange={setBulkSemester}
        />
        <Text style={styles.scaleInfo}>
          Notenschlüssel: {gradeScaleText(scheme)}
        </Text>
        <View style={{ height: 8 }} />
        <Text style={styles.fieldLabel}>
          Punkte (leer lassen = kein Eintrag){bulkCategory ? ` · max. ${bulkCategory.maxPoints} P` : ''}
        </Text>
        {students.map((student) => (
          <Row key={student.id} style={{ marginBottom: 6 }}>
            <Text style={{ flex: 1, fontSize: 15, color: C.text }} numberOfLines={1}>
              {student.lastName} {student.firstName}
            </Text>
            <Field
              value={bulkPoints[student.id] ?? ''}
              onChangeText={(t) =>
                setBulkPoints((p) => ({ ...p, [student.id]: t }))
              }
              keyboardType="decimal-pad"
              style={{ width: 80, textAlign: 'center' }}
              placeholder="–"
            />
          </Row>
        ))}
        <View style={{ marginTop: 8 }}>
          <Button title="Einträge speichern" onPress={saveBulk} />
        </View>
      </Sheet>

      {/* Klasse bearbeiten */}
      <Sheet visible={showEdit} title="Klasse bearbeiten" onClose={() => setShowEdit(false)}>
        <Field label="Klassenname" value={editName} onChangeText={setEditName} />
        <Field label="Schuljahr" value={editYear} onChangeText={setEditYear} />
        <Text style={styles.fieldLabel}>Farbe (für die Übersicht)</Text>
        <ColorPicker value={editColor} onChange={setEditColor} />
        <View style={{ height: 18 }} />
        <Button title="Speichern" onPress={saveEdit} disabled={!editName.trim()} />
        <View style={{ height: 24 }} />
        <Button
          title={cls.archived ? 'Aus dem Archiv holen' : 'Klasse archivieren'}
          variant="secondary"
          onPress={toggleArchive}
        />
        <Text style={styles.archiveHint}>
          Archivierte Klassen wandern auf der Startseite in den Bereich
          „Archiv“ und bleiben dort einsehbar.
        </Text>
        <View style={{ height: 12 }} />
        <Button title="Klasse löschen …" variant="danger" onPress={removeClass} />
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: 'center' },
  inner: { width: '100%', maxWidth: 1100 },
  tr: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#eef1f4',
    gap: 0,
  },
  thead: { backgroundColor: '#eef4f4' },
  th: { fontSize: 13, fontWeight: '700', color: C.primaryDark },
  thMax: { fontSize: 11, color: C.textMuted },
  nameCell: { width: 190 },
  name: { fontSize: 15, color: C.text, fontWeight: '500' },
  pointCell: { width: 92, alignItems: 'center' },
  points: { fontSize: 15, color: C.text, textAlign: 'center' },
  total: { fontWeight: '700' },
  gradeCell: { width: 60, alignItems: 'center' },
  gradeBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  legend: { fontSize: 12.5, color: C.textMuted, marginTop: 12, lineHeight: 18 },
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
  fieldLabel: { fontSize: 13, fontWeight: '600', color: C.textMuted, marginBottom: 6 },
  hint: { fontSize: 13, color: C.textMuted, marginBottom: 10, fontStyle: 'italic' },
  archiveHint: {
    fontSize: 12,
    color: C.textMuted,
    lineHeight: 17,
    marginTop: 8,
  },
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
