import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function InventoryHeader({ onAddProduct, onScanBarcode, onOpenArchived, scanDisabled }) {
  return (
    <View style={styles.header}>
      <Text style={styles.eyebrow}>PRODUCT CATALOG</Text>
      <Text style={styles.title}>Inventory</Text>
      <Text style={styles.subtitle}>Find, update, and organize products for your store.</Text>
      <Pressable accessibilityRole="button" onPress={onAddProduct} style={styles.primaryButton}>
        <Ionicons name="add-circle-outline" size={21} color="#fff" />
        <Text style={styles.primaryText}>Add product</Text>
      </Pressable>
      <View style={styles.secondaryRow}>
        <Pressable accessibilityRole="button" disabled={scanDisabled} onPress={onScanBarcode}
          style={[styles.secondaryButton, scanDisabled && styles.disabled]}>
          <Ionicons name="barcode-outline" size={19} color="#17663c" />
          <Text style={styles.secondaryText}>Scan barcode</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onOpenArchived} style={styles.secondaryButton}>
          <Ionicons name="archive-outline" size={18} color="#17663c" />
          <Text style={styles.secondaryText}>Archived</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: 8, marginBottom: 5 },
  eyebrow: { color: '#35694d', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: '#18291f', fontSize: 30, fontWeight: '700' },
  subtitle: { color: '#647268', fontSize: 13, marginBottom: 10 },
  primaryButton: { minHeight: 50, borderRadius: 12, backgroundColor: '#17663c', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryRow: { flexDirection: 'row', gap: 10 },
  secondaryButton: { flex: 1, minWidth: 0, minHeight: 46, borderRadius: 12, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#d8e2da', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, paddingHorizontal: 6 },
  secondaryText: { color: '#17663c', fontSize: 13, fontWeight: '700' },
  disabled: { opacity: 0.5 },
});
