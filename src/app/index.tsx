import { Stack, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  Button,
  C,
  Card,
  ColorPicker,
  EmptyState,
  Field,
  Row,
  Segmented,
  Sheet,
} from '@/components/ui';
import { sortStudents, useStore } from '@/lib/store';
import type { SchoolClass } from '@/lib/types';

function currentSchoolYear(): string {
  const now = new Date();
  const year = now.getMonth() + 1 >= 9 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}/${String((year + 1) % 100).padStart(2, '0')}`;
}

function byYearAndName(a: SchoolClass, b: SchoolClass): number {
  return (
    b.schoolYear.localeCompare(a.schoolYear) ||
    a.name.localeCompare(b.name, 'de')
  );
}

export default function ClassListScreen() {
  const { data, loaded, addClass, addStudent } = useStore();
  const router = useRouter();

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [schoolYear, setSchoolYear] = useState(currentSchoolYear());
  const [schemeId, setSchemeId] = useState(data.schemes[0]?.id ?? '');
  const [color, setColor] = useState<string | undefined>(undefined);
  const [copyFromId, setCopyFromId] = useState<string | undefined>(undefined);
  const [showArchive, setShowArchive] = useState(false);

  const activeClasses = useMemo(
    () => data.classes.filter((c) => !c.archived).sort(byYearAndName),
    [data.classes]
  );
  const archivedClasses = useMemo(
    () => data.classes.filter((c) => c.archived).sort(byYearAndName),
    [data.classes]
  );
  const copySources = useMemo(
    () => [...data.classes].sort(byYearAndName),
    [data.classes]
  );

  const openAdd = () => {
    setName('');
    setSchoolYear(currentSchoolYear());
    setSchemeId(data.schemes[0]?.id ?? '');
    setColor(undefined);
    setCopyFromId(undefined);
    setShowAdd(true);
  };

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const cls = addClass(trimmed, schoolYear.trim(), schemeId, color);
    if (copyFromId) {
      const source = sortStudents(
        data.students.filter((s) => s.classId === copyFromId)
      );
      for (const s of source) {
        addStudent(cls.id, s.lastName, s.firstName);
      }
    }
    setShowAdd(false);
    router.push({ pathname: '/class/[classId]', params: { classId: cls.id } });
  };

  if (!loaded) return null;

  const renderClassCard = (cls: SchoolClass) => {
    const scheme = data.schemes.find((s) => s.id === cls.schemeId);
    const count = data.students.filter((s) => s.classId === cls.id).length;
    return (
      <Pressable
        key={cls.id}
        onPress={() =>
          router.push({ pathname: '/class/[classId]', params: { classId: cls.id } })
        }
      >
        {({ pressed }) => (
          <Card
            style={{
              opacity: pressed ? 0.7 : cls.archived ? 0.8 : 1,
              backgroundColor: cls.color ?? C.card,
            }}
          >
            <Row style={{ justifyContent: 'space-between' }}>
              <View>
                <Row>
                  <Text style={styles.className}>{cls.name}</Text>
                  {cls.archived ? (
                    <View style={styles.archivedBadge}>
                      <Text style={styles.archivedBadgeText}>Archiviert</Text>
                    </View>
                  ) : null}
                </Row>
                <Text style={styles.classMeta}>
                  Schuljahr {cls.schoolYear} · Schema {scheme?.name ?? '–'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.count}>{count}</Text>
                <Text style={styles.classMeta}>Schüler:innen</Text>
              </View>
            </Row>
          </Card>
        )}
      </Pressable>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => router.push('/settings')} hitSlop={10}>
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600', marginRight: 16 }}>
                Sicherung
              </Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.inner}>
          <Row style={{ justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={styles.heading}>Meine Klassen</Text>
            <Button title="+ Neue Klasse" onPress={openAdd} />
          </Row>

          {activeClasses.length === 0 && archivedClasses.length === 0 ? (
            <EmptyState
              title="Noch keine Klassen"
              hint="Lege mit „+ Neue Klasse“ deine erste Klasse an. Danach kannst du Schüler:innen hinzufügen und Punkte eintragen."
            />
          ) : (
            <>
              {activeClasses.length === 0 ? (
                <EmptyState title="Keine aktiven Klassen" />
              ) : (
                <View style={{ gap: 12 }}>{activeClasses.map(renderClassCard)}</View>
              )}

              {archivedClasses.length > 0 ? (
                <View style={{ marginTop: 24 }}>
                  <Pressable onPress={() => setShowArchive((v) => !v)}>
                    <Row style={{ marginBottom: 12 }}>
                      <Text style={styles.archiveHeading}>
                        {showArchive ? '▾' : '▸'} Archiv ({archivedClasses.length})
                      </Text>
                    </Row>
                  </Pressable>
                  {showArchive ? (
                    <View style={{ gap: 12 }}>
                      {archivedClasses.map(renderClassCard)}
                    </View>
                  ) : null}
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

      <Sheet visible={showAdd} title="Neue Klasse anlegen" onClose={() => setShowAdd(false)}>
        <Field
          label="Klassenname (z. B. 8BC)"
          value={name}
          onChangeText={setName}
          autoFocus
        />
        <Field label="Schuljahr" value={schoolYear} onChangeText={setSchoolYear} />
        <Text style={styles.fieldLabel}>Punkteschema</Text>
        <Segmented
          options={data.schemes.map((s) => ({ label: s.name, value: s.id }))}
          value={schemeId}
          onChange={setSchemeId}
        />
        <View style={{ height: 16 }} />
        <Text style={styles.fieldLabel}>Farbe (für die Übersicht)</Text>
        <ColorPicker value={color} onChange={setColor} />
        {copySources.length > 0 ? (
          <>
            <View style={{ height: 16 }} />
            <Text style={styles.fieldLabel}>
              Schüler:innen übernehmen aus (nur Namen, ohne Punkte)
            </Text>
            <Row style={{ flexWrap: 'wrap' }}>
              <Pressable
                onPress={() => setCopyFromId(undefined)}
                style={[styles.chip, copyFromId === undefined && styles.chipActive]}
              >
                <Text
                  style={[
                    styles.chipText,
                    copyFromId === undefined && styles.chipTextActive,
                  ]}
                >
                  keine
                </Text>
              </Pressable>
              {copySources.map((cls) => {
                const active = copyFromId === cls.id;
                const count = data.students.filter((s) => s.classId === cls.id).length;
                return (
                  <Pressable
                    key={cls.id}
                    onPress={() => setCopyFromId(cls.id)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {cls.name} ({cls.schoolYear}, {count})
                    </Text>
                  </Pressable>
                );
              })}
            </Row>
          </>
        ) : null}
        <View style={{ marginTop: 20 }}>
          <Button title="Klasse anlegen" onPress={save} disabled={!name.trim()} />
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: 'center' },
  inner: { width: '100%', maxWidth: 800 },
  heading: { fontSize: 22, fontWeight: '700', color: C.text },
  archiveHeading: { fontSize: 16, fontWeight: '700', color: C.textMuted },
  className: { fontSize: 18, fontWeight: '700', color: C.primaryDark },
  classMeta: { fontSize: 13, color: C.textMuted, marginTop: 2 },
  count: { fontSize: 20, fontWeight: '700', color: C.text },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textMuted,
    marginBottom: 6,
  },
  archivedBadge: {
    backgroundColor: 'rgba(92,107,122,0.15)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  archivedBadgeText: { fontSize: 11.5, fontWeight: '600', color: C.textMuted },
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
