import type { Product, ProductInput } from '../../../../shared/contracts';

export interface ProductForm { name: string; barcode: string; price: string; stock_quantity: string }
export type ProductFormErrors = Partial<Record<keyof ProductForm, string>>;
export type ProductFormMode = 'add' | 'edit' | 'restore';
export const emptyProductForm: ProductForm = { name: '', barcode: '', price: '', stock_quantity: '' };

export function productFormFromProduct(product: Product, requireNewStock = false): ProductForm {
  return {
    name: product.name,
    barcode: product.barcode,
    price: String(product.price),
    stock_quantity: requireNewStock ? '' : String(product.stock_quantity),
  };
}

export function validateProductForm(form: ProductForm): { errors: ProductFormErrors; payload: ProductInput | null } {
  const name = form.name.trim();
  const barcode = form.barcode.trim();
  const priceText = form.price.trim();
  const stockText = form.stock_quantity.trim();
  const price = Number(priceText);
  const stockQuantity = Number(stockText);
  const errors: ProductFormErrors = {};

  if (!name) errors.name = 'Enter a product name.';
  if (!barcode) errors.barcode = 'Enter a barcode.';
  if (!/^\d+(?:\.\d{1,2})?$/.test(priceText) || !Number.isSafeInteger(Math.round(price * 100))) {
    errors.price = 'Enter a PHP price with up to two decimal places.';
  }
  if (!/^\d+$/.test(stockText) || !Number.isSafeInteger(stockQuantity)) {
    errors.stock_quantity = 'Enter a whole-number stock quantity.';
  }

  return {
    errors,
    payload: Object.keys(errors).length ? null : {
      name, barcode, price, stock_quantity: stockQuantity,
    },
  };
}
