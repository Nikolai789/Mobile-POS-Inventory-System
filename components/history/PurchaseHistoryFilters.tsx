import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { SalesSort } from '../../frontend/types/purchaseHistory';
import { formatBusinessDate } from '../../frontend/utils/businessTime';

interface PurchaseHistoryFiltersProps {
  date: string | null;
  sort: SalesSort;
  onChooseDate: () => void;
  onClearDate: () => void;
  onSortChange: (sort: SalesSort) => void;
}

const SORT_OPTIONS: { value: SalesSort; label: string }[] = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
];

export default function PurchaseHistoryFilters({ date, sort, onChooseDate, onClearDate, onSortChange }: PurchaseHistoryFiltersProps) {
  return <View style={styles.filters}>
    <Text style={styles.label}>Receipt date · Philippine time</Text>
    <Text style={styles.selectedDate}>{date ? formatBusinessDate(date) : 'All dates'}</Text>
    <View style={styles.row}>
      <Pressable onPress={onChooseDate} style={styles.button} accessibilityRole="button">
        <Text style={styles.buttonText}>Choose date</Text>
      </Pressable>
      {date ? <Pressable onPress={onClearDate} style={styles.button} accessibilityRole="button">
        <Text style={styles.buttonText}>Clear date</Text>
      </Pressable> : null}
    </View>
    <Text style={styles.label}>Receipt order</Text>
    <View style={styles.row} accessibilityLabel="Receipt order">
      {SORT_OPTIONS.map((option) => <Pressable
        key={option.value}
        onPress={() => onSortChange(option.value)}
        style={[styles.button, option.value === sort && styles.selectedButton]}
        accessibilityRole="button"
        accessibilityState={{ selected: option.value === sort }}
        {...(Platform.OS === 'web' ? { 'aria-pressed': option.value === sort } : {})}
      >
        <Text style={[styles.buttonText, option.value === sort && styles.selectedText]}>{option.label}</Text>
      </Pressable>)}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  filters: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 10, marginVertical: 6 },
  label: { color: '#555', fontSize: 12, fontWeight: '600' },
  selectedDate: { color: '#18291f', fontSize: 17, fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: { minHeight: 44, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: '#d6e0ec', justifyContent: 'center' },
  buttonText: { color: '#35694d', fontWeight: '600', fontSize: 13 },
  selectedButton: { backgroundColor: '#35694d', borderColor: '#35694d' },
  selectedText: { color: '#fff' },
});
