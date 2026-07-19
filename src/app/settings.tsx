import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, C, Card, confirmAsync, notify } from '@/components/ui';
import { exportBackup, pickBackupFile } from '@/lib/backup';
import { useStore } from '@/lib/store';

export default function SettingsScreen() {
  const { data, replaceAll } = useStore();
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const doExport = () => {
    try {
      exportBackup(data);
    } catch (e) {
      notify('Export nicht möglich', String((e as Error).message));
    }
  };

  const doImport = async () => {
    try {
      const imported = await pickBackupFile();
      if (!imported) return;
      const ok = await confirmAsync(
        'Sicherung laden?',
        `Die Sicherung enthält ${imported.classes.length} Klasse(n) und ${imported.students.length} Schüler:innen.\n\nACHTUNG: Alle aktuell in der App vorhandenen Daten werden dabei ersetzt.`
      );
      if (ok) {
        replaceAll(imported);
        notify('Sicherung geladen', 'Die Daten wurden übernommen.');
      }
    } catch (e) {
      notify('Import fehlgeschlagen', String((e as Error).message));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable onPress={goBack} hitSlop={12}>
              <Text style={styles.backArrow}>←</Text>
            </Pressable>
          ),
        }}
      />
      <View style={styles.inner}>
        <Card style={{ marginBottom: 16 }}>
          <Text style={styles.title}>Daten sichern</Text>
          <Text style={styles.text}>
            Speichert alle Klassen, Schüler:innen und Punkte in eine Datei
            (z. B. „MusikPunkte_Sicherung_….json“). Diese Datei kannst du
            aufbewahren oder auf einem anderen Computer wieder laden.
          </Text>
          <Button title="Sicherungsdatei herunterladen" onPress={doExport} />
        </Card>

        <Card style={{ marginBottom: 16 }}>
          <Text style={styles.title}>Sicherung laden</Text>
          <Text style={styles.text}>
            Lädt eine zuvor gespeicherte Sicherungsdatei – zum Beispiel, um den
            Stand vom PC auf den Mac zu übernehmen. Die aktuellen Daten in der
            App werden dabei ersetzt.
          </Text>
          <Button title="Sicherungsdatei auswählen …" variant="secondary" onPress={doImport} />
        </Card>

        <Card>
          <Text style={styles.title}>Wo sind meine Daten?</Text>
          <Text style={styles.text}>
            Alle Daten bleiben ausschließlich auf diesem Gerät gespeichert –
            es wird nichts ins Internet übertragen. Wichtig: Erstelle
            regelmäßig eine Sicherungsdatei, besonders vor dem Leeren des
            Browser-Speichers oder einem Gerätewechsel.
          </Text>
          <Text style={[styles.text, { marginBottom: 0 }]}>
            Aktueller Stand: {data.classes.length} Klasse(n),{' '}
            {data.students.length} Schüler:innen, {data.entries.length}{' '}
            Punkteeinträge.
          </Text>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: 'center' },
  inner: { width: '100%', maxWidth: 640 },
  title: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 6 },
  text: { fontSize: 14, color: C.textMuted, lineHeight: 20, marginBottom: 14 },
  backArrow: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 12,
  },
});
