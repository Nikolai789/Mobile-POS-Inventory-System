import { colors } from '../../../shared/theme';
import { useRef, useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ArchivedProduct } from '../../../../shared/contracts';
import { deleteArchivedProduct } from '../../../shared/api/products';
import { normalizeRequestError } from '../../../shared/api/errors';
import useProductCatalog from '../hooks/useProductCatalog';
import useProductForm from '../hooks/useProductForm';
import ProductFormModal from '../components/ProductFormModal';
import ProductRow from '../components/ProductRow';
import ProductSearchBar from '../components/ProductSearchBar';

export default function ArchivedProductsScreen() {
  const catalog = useProductCatalog<ArchivedProduct>({ status: 'archived' });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteFailure, setDeleteFailure] = useState<{ id: number; message: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ArchivedProduct | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const deletingRef = useRef(false);
  const editor = useProductForm(() => { setDeleteFailure(null); catalog.refresh(); });
  const { form, fieldErrors, error: formError, saving, update: updateForm, save: saveRestore } = editor;
  function openRestore(product: ArchivedProduct) { setDeleteFailure(null); editor.open(product, 'restore'); }
  async function permanentlyDelete(product: ArchivedProduct | null) {
    if (!product || deletingRef.current || saving) return;
    deletingRef.current = true;
    setDeletingId(product.id);
    setDeleteFailure(null);
    try {
      await deleteArchivedProduct(product.id);
      catalog.refresh();
    } catch (cause) {
      const requestError = normalizeRequestError(cause);
      setDeleteFailure({ id: product.id, message: requestError.message });
    } finally {
      deletingRef.current = false;
      setDeletingId(null);
    }
  }

  function confirmDelete(product: ArchivedProduct) {
    if (!product.can_delete || deletingRef.current || saving) return;
    setPendingDelete(product);
    setConfirmVisible(true);
  }

  return <>
    <FlatList
      style={styles.screen}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.container}
      data={catalog.loading ? [] : catalog.items}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={<>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>PRODUCT CATALOG</Text>
          <Text style={styles.title}>Archived products</Text>
          <Text style={styles.subtitle}>Search past products, restore them, or remove unused ones.</Text>
          <Pressable accessibilityRole="button" onPress={() => router.navigate('/inventory')} style={styles.backButton}>
            <Text style={styles.backText}>Back to inventory</Text>
          </Pressable>
        </View>
        <Text style={styles.sectionTitle}>Find an archived product</Text>
        <ProductSearchBar value={catalog.query} onChangeText={catalog.setQuery}
          accessibilityLabel="Search archived products by name or barcode"
          placeholder="Search archived name or barcode" />
        {catalog.error ? <View style={styles.errorBox}><Text style={styles.error}>{catalog.error}</Text></View> : null}
        {catalog.loading ? <ActivityIndicator accessibilityLabel="Loading archived products" /> : null}
      </>}
      ListEmptyComponent={!catalog.loading && !catalog.error
        ? <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>{catalog.query ? 'No matching archived products' : 'No archived products'}</Text>
          <Text style={styles.emptyText}>{catalog.query ? 'Try another name or barcode.' : 'Archived products will appear here.'}</Text>
        </View> : null}
      renderItem={({ item }) => <ProductRow
        product={item}
        archived
        deleting={deletingId === item.id}
        disabled={saving || Boolean(deletingId)}
        deleteError={deleteFailure?.id === item.id ? deleteFailure.message : ''}
        onRestore={() => openRestore(item)}
        onDelete={() => confirmDelete(item)}
      />}
      onEndReached={catalog.loadMore}
      onEndReachedThreshold={0.4}
      ListFooterComponent={<>
        {catalog.loadingMore ? <ActivityIndicator accessibilityLabel="Loading more archived products" /> : null}
        <Pressable accessibilityRole="button" onPress={() => { setDeleteFailure(null); catalog.refresh(); }} style={styles.refreshButton}>
          <Text style={styles.refreshText}>Refresh archived products</Text>
        </Pressable>
      </>}
    />
    <ProductFormModal
      visible={editor.visible}
      mode="restore"
      form={form}
      saving={saving}
      error={formError}
      fieldErrors={fieldErrors}
      onChange={updateForm}
      onSave={saveRestore}
      onClose={editor.close}
    />
    <Modal visible={confirmVisible} transparent animationType="fade"
      onRequestClose={() => setConfirmVisible(false)}>
      <View style={styles.confirmOverlay}>
        <View style={styles.confirmCard}>
          <Text style={styles.confirmEyebrow}>PERMANENT DELETE</Text>
          <Text style={styles.confirmTitle}>Delete {pendingDelete?.name}?</Text>
          <Text style={styles.confirmMessage}>This product will be removed permanently. This cannot be undone.</Text>
          <View style={styles.confirmActions}>
            <Pressable accessibilityRole="button" onPress={() => setConfirmVisible(false)} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => {
              const product = pendingDelete;
              setConfirmVisible(false);
              permanentlyDelete(product);
            }} style={styles.deleteButton}>
              <Text style={styles.deleteText}>Delete product</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, paddingBottom: 36, gap: 14 },
  header: { gap: 7, marginBottom: 8 },
  eyebrow: { color: '#35694d', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 30, fontWeight: '700' },
  subtitle: { color: colors.muted, fontSize: 13 },
  backButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  backText: { color: colors.primary, fontWeight: '700' },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '700' },
  errorBox: { backgroundColor: colors.errorBackground, borderRadius: 12, padding: 14 },
  error: { color: colors.error, fontSize: 13 },
  emptyBox: { backgroundColor: '#fff', borderRadius: 16, padding: 22, alignItems: 'center', gap: 6 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  emptyText: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  refreshButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  refreshText: { color: colors.primary, fontWeight: '700' },
  confirmOverlay: { flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 20 },
  confirmCard: { backgroundColor: '#fff', borderRadius: 18, padding: 20, gap: 12 },
  confirmEyebrow: { color: colors.error, fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  confirmTitle: { color: colors.text, fontSize: 22, fontWeight: '700' },
  confirmMessage: { color: '#526158', fontSize: 14, lineHeight: 20 },
  confirmActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelButton: { flex: 1, minHeight: 46, borderRadius: 10, backgroundColor: '#edf0ed',
    alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#526158', fontWeight: '700' },
  deleteButton: { flex: 1, minHeight: 46, borderRadius: 10, backgroundColor: colors.error,
    alignItems: 'center', justifyContent: 'center' },
  deleteText: { color: '#fff', fontWeight: '700' },
});
