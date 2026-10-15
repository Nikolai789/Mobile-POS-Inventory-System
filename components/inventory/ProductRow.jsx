import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatMoney } from '../../frontend/utils/money';

export default function ProductRow({ product, archived = false, busy = false, deleting = false,
  disabled = false, deleteError = '', onEdit, onArchive, onRestore, onDelete }) {
  const outOfStock = product.stock_quantity === 0;
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.nameBlock}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.barcode}>Barcode · {product.barcode}</Text>
        </View>
        <View style={[styles.badge, archived ? styles.archivedBadge : outOfStock ? styles.emptyBadge : styles.stockBadge]}>
          <Text style={[styles.badgeText, archived ? styles.archivedText : outOfStock ? styles.emptyText : styles.stockText]}>
            {archived ? 'Archived' : outOfStock ? 'Out of stock' : 'In stock'}
          </Text>
        </View>
      </View>
      <View style={styles.details}>
        <View>
          <Text style={styles.detailLabel}>PRICE</Text>
          <Text style={styles.detailValue}>{formatMoney(product.price)}</Text>
        </View>
        {!archived ? <View>
          <Text style={styles.detailLabel}>QUANTITY</Text>
          <Text style={styles.detailValue}>{product.stock_quantity}</Text>
        </View> : null}
      </View>
      <View style={styles.actions}>
        {archived ? <>
          <Pressable accessibilityRole="button" disabled={disabled} onPress={onRestore}
            style={[styles.action, styles.primaryAction, styles.restoreAction, disabled && styles.disabled]}>
            <Text style={styles.primaryActionText}>Restore product</Text>
          </Pressable>
          {Boolean(product.can_delete) ? <Pressable accessibilityRole="button" disabled={disabled}
            onPress={onDelete} style={[styles.action, styles.archiveAction, disabled && styles.disabled]}>
            <Text style={styles.archiveText}>{deleting ? 'Deleting...' : 'Delete'}</Text>
          </Pressable> : null}
        </> : <>
          <Pressable accessibilityRole="button" disabled={disabled} onPress={onEdit}
            style={[styles.action, styles.editAction, disabled && styles.disabled]}>
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={disabled} onPress={onArchive}
            style={[styles.action, styles.archiveAction, disabled && styles.disabled]}>
            <Text style={styles.archiveText}>{busy ? 'Archiving...' : 'Archive'}</Text>
          </Pressable>
        </>}
      </View>
      {archived && !product.can_delete ? <Text style={styles.saleHistoryNote}>Used in sales · cannot delete</Text> : null}
      {deleteError ? <Text style={styles.deleteError}>{deleteError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 14,
    borderWidth: 1, borderColor: '#e4ebe5' },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  nameBlock: { flex: 1, minWidth: 0, gap: 4 },
  name: { color: '#18291f', fontSize: 17, fontWeight: '700' },
  barcode: { color: '#647268', fontSize: 12 },
  badge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 5 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  stockBadge: { backgroundColor: '#e7f4ea' }, stockText: { color: '#17663c' },
  emptyBadge: { backgroundColor: '#fff0e9' }, emptyText: { color: '#a44725' },
  archivedBadge: { backgroundColor: '#edf0ed' }, archivedText: { color: '#526158' },
  details: { flexDirection: 'row', gap: 32 },
  detailLabel: { color: '#829087', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  detailValue: { color: '#18291f', fontSize: 16, fontWeight: '700', marginTop: 3 },
  actions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#edf0ed', paddingTop: 12 },
  action: { minHeight: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  editAction: { backgroundColor: '#e8f3eb' }, editText: { color: '#17663c', fontWeight: '700' },
  archiveAction: { backgroundColor: '#fff1ee' }, archiveText: { color: '#a22d21', fontWeight: '700' },
  primaryAction: { backgroundColor: '#17663c', alignSelf: 'stretch' },
  restoreAction: { flex: 1 },
  primaryActionText: { color: '#fff', fontWeight: '700' },
  saleHistoryNote: { color: '#647268', fontSize: 12 },
  deleteError: { color: '#a22d21', fontSize: 12 },
  disabled: { opacity: 0.5 },
});
