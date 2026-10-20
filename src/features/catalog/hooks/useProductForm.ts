import { useRef, useState } from 'react';
import type { Product } from '../../../../shared/contracts';
import { createProduct, restoreProduct, updateProduct } from '../../../shared/api/products';
import { normalizeRequestError } from '../../../shared/api/errors';
import { emptyProductForm, productFormFromProduct, validateProductForm } from '../utils/productForm';
import type { ProductForm, ProductFormErrors, ProductFormMode } from '../utils/productForm';

export default function useProductForm(onSaved: () => void) {
  const [visible, setVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [mode, setMode] = useState<ProductFormMode>('add');
  const [form, setForm] = useState<ProductForm>(emptyProductForm);
  const [fieldErrors, setFieldErrors] = useState<ProductFormErrors>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  function open(product: Product | null = null, nextMode: ProductFormMode = product ? 'edit' : 'add', barcode = '') {
    if (savingRef.current) return;
    setSelectedProduct(product);
    setMode(nextMode);
    setForm(product ? productFormFromProduct(product, nextMode === 'restore') : { ...emptyProductForm, barcode });
    setFieldErrors({});
    setError('');
    setVisible(true);
  }
  function close() {
    if (savingRef.current) return;
    setVisible(false);
    setSelectedProduct(null);
    setError('');
    setFieldErrors({});
  }
  function update(changes: Partial<ProductForm>) {
    setForm((current) => ({ ...current, ...changes }));
    setError('');
    setFieldErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(changes) as (keyof ProductForm)[]) delete next[key];
      return next;
    });
  }
  async function save() {
    if (savingRef.current) return;
    const { payload, errors } = validateProductForm(form);
    setFieldErrors(errors);
    if (!payload) return;
    savingRef.current = true;
    setSaving(true);
    setError('');
    try {
      if (mode === 'restore' && selectedProduct) await restoreProduct(selectedProduct.id, payload);
      else if (selectedProduct) await updateProduct(selectedProduct.id, payload);
      else await createProduct(payload);
      setVisible(false);
      setSelectedProduct(null);
      onSaved();
    } catch (cause) {
      setError(normalizeRequestError(cause).message);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }
  return { visible, selectedProduct, mode, form, fieldErrors, error, saving, open, close, update, save };
}
