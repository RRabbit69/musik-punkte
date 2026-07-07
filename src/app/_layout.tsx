import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { C } from '@/components/ui';
import { StoreProvider } from '@/lib/store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <StoreProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: C.primary },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: C.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Musik-Punkte' }} />
        <Stack.Screen name="class/[classId]" options={{ title: 'Klasse' }} />
        <Stack.Screen name="student/[studentId]" options={{ title: 'Schüler:in' }} />
        <Stack.Screen name="settings" options={{ title: 'Sicherung & Einstellungen' }} />
      </Stack>
    </StoreProvider>
  );
}
