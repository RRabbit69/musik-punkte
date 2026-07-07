import React from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

export const C = {
  primary: '#0f766e',
  primaryDark: '#115e59',
  primaryLight: '#ccfbf1',
  bg: '#f2f5f7',
  card: '#ffffff',
  border: '#d8dee4',
  text: '#1a2530',
  textMuted: '#5c6b7a',
  danger: '#dc2626',
  warn: '#b45309',
};

export function confirmAsync(title: string, message: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Abbrechen', style: 'cancel', onPress: () => resolve(false) },
      { text: 'OK', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
  } else {
    Alert.alert(title, message);
  }
}

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  small?: boolean;
  disabled?: boolean;
};

export function Button({ title, onPress, variant = 'primary', small, disabled }: ButtonProps) {
  const bg =
    variant === 'primary'
      ? C.primary
      : variant === 'danger'
        ? C.danger
        : variant === 'secondary'
          ? C.card
          : 'transparent';
  const fg = variant === 'primary' || variant === 'danger' ? '#fff' : variant === 'ghost' ? C.primary : C.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        {
          backgroundColor: bg,
          borderColor: variant === 'secondary' ? C.border : bg,
          opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
        },
      ]}
    >
      <Text style={[styles.buttonText, small && styles.buttonTextSmall, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Field({
  label,
  ...props
}: TextInputProps & { label?: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor="#9aa7b3"
        {...props}
        style={[styles.input, props.style]}
      />
    </View>
  );
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => onChange(opt.value)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Sheet({
  visible,
  title,
  onClose,
  children,
  wide,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.sheetBackdrop}>
        <View style={[styles.sheet, wide && { maxWidth: 700 }]}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.sheetClose}>✕</Text>
            </Pressable>
          </View>
          <ScrollView
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ padding: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, gap: 8 }}>
      <Text style={{ fontSize: 17, fontWeight: '600', color: C.textMuted }}>{title}</Text>
      {hint ? (
        <Text style={{ fontSize: 14, color: C.textMuted, textAlign: 'center', maxWidth: 420 }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  buttonText: { fontSize: 15, fontWeight: '600' },
  buttonTextSmall: { fontSize: 13 },
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textMuted,
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 15,
    color: C.text,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#e3e9ee',
    borderRadius: 10,
    padding: 3,
    alignSelf: 'flex-start',
  },
  segment: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  segmentActive: { backgroundColor: '#fff' },
  segmentText: { fontSize: 13, fontWeight: '600', color: C.textMuted },
  segmentTextActive: { color: C.primary },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,30,40,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  sheet: {
    backgroundColor: C.bg,
    borderRadius: 16,
    width: '100%',
    maxWidth: 460,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: C.card,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  sheetClose: { fontSize: 18, color: C.textMuted, paddingHorizontal: 4 },
});
