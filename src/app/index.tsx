import { Stack, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  Button,
  C,
  Card,
  EmptyState,
  Field,
  Row,
  Segmented,
  Sheet,
} from '@/components/ui';
import { useStore } from '@/lib/store';

function currentSchoolYear(): string {
  const now = new Date();
  const year = now.getMonth() + 1 >= 9 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}/${String((year + 1) % 100).padStart(2, '0')}`;
}

export default function ClassListScreen() {
  const { data, loaded, addClass } = useStore();
  const router = useRouter();

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [schoolYear, setSchoolYear] = useState(currentSchoolYear());
  const [schemeId, setSchemeId] = useState(data.schemes[0]?.id ?? '');

  const classes = useMemo(
    () =>
      [...data.classes].sort((a, b) =>
        (b.schoolYear + a.name).localeCompare(a.schoolYear + b.name, 'de')
      ),
    [data.classes]
  );

  const openAdd = () => {
    setName('');
    setSchoolYear(currentSchoolYear());
    setSchemeId(data.schemes[0]?.id ?? '');
    setShowAdd(true);
  };

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const cls = addClass(trimmed, schoolYear.trim(), schemeId);
    setShowAdd(false);
    router.push({ pathname: '/class/[classId]', params: { classId: cls.id } });
  };

  if (!loaded) return null;

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

          {classes.length === 0 ? (
            <EmptyState
              title="Noch keine Klassen"
              hint="Lege mit „+ Neue Klasse“ deine erste Klasse an. Danach kannst du Schüler:innen hinzufügen und Punkte eintragen."
            />
          ) : (
            <View style={{ gap: 12 }}>
              {classes.map((cls) => {
                const scheme = data.schemes.find((s) => s.id === cls.schemeId);
                const count = data.students.filter((s) => s.classId === cls.id).length;
                return (
                  <Pressable
                    key={cls.id}
                    onPress={() =>
                      router.push({
                        pathname: '/class/[classId]',
                        params: { classId: cls.id },
                      })
                    }
                  >
                    {({ pressed }) => (
                      <Card style={{ opacity: pressed ? 0.7 : 1 }}>
                        <Row style={{ justifyContent: 'space-between' }}>
                          <View>
                            <Text style={styles.className}>{cls.name}</Text>
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
              })}
            </View>
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
        <Text style={{ fontSize: 13, fontWeight: '600', color: C.textMuted, marginBottom: 5 }}>
          Punkteschema
        </Text>
        <Segmented
          options={data.schemes.map((s) => ({ label: s.name, value: s.id }))}
          value={schemeId}
          onChange={setSchemeId}
        />
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
  className: { fontSize: 18, fontWeight: '700', color: C.primaryDark },
  classMeta: { fontSize: 13, color: C.textMuted, marginTop: 2 },
  count: { fontSize: 20, fontWeight: '700', color: C.text },
});
