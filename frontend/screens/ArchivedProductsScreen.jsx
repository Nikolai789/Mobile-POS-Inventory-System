import { useCallback, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { deleteArchivedProduct, restoreProduct } from '../api/client';
import useProductCatalog from '../hooks/useProductCatalog';
import { emptyProductForm, productFormFromProduct, validateProductForm } from '../utils/productForm';
import ProductFormModal from '../../components/inventory/ProductFormModal';
import ProductRow from '../../components/inventory/ProductRow';
import ProductSearchBar from '../../components/products/ProductSearchBar';

export default function ArchivedProductsScreen() {
  const catalog = useProductCatalog(false, false, 'archived');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [form, setForm] = useState(emptyProductForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteFailure, setDeleteFailure] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const deletingRef = useRef(false);

  useFocusEffect(useCallback(() => {
    catalog.refresh();
  }, [catalog.refresh]));

  function openRestore(product) {
    setDeleteFailure(null);
    setSelectedProduct(product);
    setForm(productFormFromProduct(product, true));
    setFieldErrors({});
    setFormError('');
  }

  function updateForm(changes) {
    setForm((current) => ({ ...current, ...changes }));
    setFormError('');
    setFieldErrors((current) => {
      const next = { ...current };
      Object.keys(changes).forEach((key) => { delete next[key]; });
      return next;
    });
  }

  async function saveRestore() {
    if (!selectedProduct || saving) return;
    const { payload, errors } = validateProductForm(form);
    setFieldErrors(errors);
    if (!payload) return;
    setSaving(true);
    setFormError('');
    try {
      await restoreProduct(selectedProduct.id, payload);
      setSelectedProduct(null);
      setDeleteFailure(null);
      catalog.refresh();
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function permanentlyDelete(product) {
    if (!product || deletingRef.current || saving) return;
    deletingRef.current = true;
    setDeletingId(product.id);
    setDeleteFailure(null);
    try {
      await deleteArchivedProduct(product.id);
      catalog.refresh();
    } catch (requestError) {
      setDeleteFailure({ id: product.id, message: requestError.message });
    } finally {
      deletingRef.current = false;
      setDeletingId(null);
    }
  }

  function confirmDelete(product) {
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
      visible={Boolean(selectedProduct)}
      mode="restore"
      form={form}
      saving={saving}
      error={formError}
      fieldErrors={fieldErrors}
      onChange={updateForm}
      onSave={saveRestore}
      onClose={() => { setSelectedProduct(null); setFormError(''); setFieldErrors({}); }}
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
  screen: { flex: 1, backgroundColor: '#f5f7f4' },
  container: { padding: 16, paddingBottom: 36, gap: 14 },
  header: { gap: 7, marginBottom: 8 },
  eyebrow: { color: '#35694d', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: '#18291f', fontSize: 30, fontWeight: '700' },
  subtitle: { color: '#647268', fontSize: 13 },
  backButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  backText: { color: '#17663c', fontWeight: '700' },
  sectionTitle: { color: '#18291f', fontSize: 19, fontWeight: '700' },
  errorBox: { backgroundColor: '#fff1ee', borderRadius: 12, padding: 14 },
  error: { color: '#a22d21', fontSize: 13 },
  emptyBox: { backgroundColor: '#fff', borderRadius: 16, padding: 22, alignItems: 'center', gap: 6 },
  emptyTitle: { color: '#18291f', fontSize: 16, fontWeight: '700' },
  emptyText: { color: '#647268', fontSize: 13, textAlign: 'center' },
  refreshButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  refreshText: { color: '#17663c', fontWeight: '700' },
  confirmOverlay: { flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 20 },
  confirmCard: { backgroundColor: '#fff', borderRadius: 18, padding: 20, gap: 12 },
  confirmEyebrow: { color: '#a22d21', fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  confirmTitle: { color: '#18291f', fontSize: 22, fontWeight: '700' },
  confirmMessage: { color: '#526158', fontSize: 14, lineHeight: 20 },
  confirmActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelButton: { flex: 1, minHeight: 46, borderRadius: 10, backgroundColor: '#edf0ed',
    alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#526158', fontWeight: '700' },
  deleteButton: { flex: 1, minHeight: 46, borderRadius: 10, backgroundColor: '#a22d21',
    alignItems: 'center', justifyContent: 'center' },
  deleteText: { color: '#fff', fontWeight: '700' },
});
