import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export interface HistoryDatePickerProps {
  value: string | null;
  onApply: (date: string) => void;
  onCancel: () => void;
}

interface DatePickerDialogProps {
  children: ReactNode;
  onApply: () => void;
  onCancel: () => void;
  applyDisabled?: boolean;
}

export default function DatePickerDialog({ children, onApply, onCancel, applyDisabled }: DatePickerDialogProps) {
  return <Modal transparent animationType="fade" onRequestClose={onCancel}>
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessibilityRole="button" accessibilityLabel="Cancel date selection" />
      <View style={styles.card} accessibilityViewIsModal>
        <Text style={styles.title} accessibilityRole="header">Choose receipt date</Text>
        <Text style={styles.hint}>Dates use Philippine time.</Text>
        {children}
        <View style={styles.actions}>
          <Pressable onPress={onCancel} style={styles.button} accessibilityRole="button">
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable onPress={onApply} disabled={applyDisabled} style={[styles.button, styles.apply, applyDisabled && styles.disabled]} accessibilityRole="button">
            <Text style={styles.applyText}>Apply</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  card: { width: '100%', maxWidth: 380, backgroundColor: '#fff', borderRadius: 18, padding: 20, gap: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#18291f' },
  hint: { color: '#555', fontSize: 13 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 12 },
  button: { minHeight: 44, minWidth: 80, borderRadius: 10, paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center' },
  apply: { backgroundColor: '#1759a7' },
  applyText: { color: '#fff', fontWeight: '700' },
  cancelText: { color: '#1759a7', fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
