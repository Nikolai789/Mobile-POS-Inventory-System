import type { Product } from '../../../../shared/contracts';
import { moneyCents, parseCashCents } from '../../../shared/utils/money';

export interface CartItem { product: Product; quantity: string }
export interface CartState { items: Record<number, CartItem>; unavailableIds: Set<number> }
export type CartAction =
  | { type: 'add'; product: Product }
  | { type: 'quantity'; id: number; quantity: string }
  | { type: 'remove'; id: number }
  | { type: 'reconcile'; ids: number[]; products: Product[] }
  | { type: 'clear' };

export function emptyCart(): CartState { return { items: {}, unavailableIds: new Set() }; }

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'clear': return emptyCart();
    case 'add': {
      const quantity = Number(state.items[action.product.id]?.quantity || 0);
      if (quantity >= action.product.stock_quantity) return state;
      const unavailableIds = new Set(state.unavailableIds);
      unavailableIds.delete(action.product.id);
      return { items: { ...state.items, [action.product.id]: { product: action.product, quantity: String(quantity + 1) } }, unavailableIds };
    }
    case 'quantity': {
      if (!/^\d*$/.test(action.quantity) || !state.items[action.id]) return state;
      return { ...state, items: { ...state.items, [action.id]: { ...state.items[action.id], quantity: action.quantity } } };
    }
    case 'remove': {
      const items = { ...state.items };
      const unavailableIds = new Set(state.unavailableIds);
      delete items[action.id];
      unavailableIds.delete(action.id);
      return { items, unavailableIds };
    }
    case 'reconcile': {
      const found = new Map(action.products.map((product) => [product.id, product]));
      const items = { ...state.items };
      const unavailableIds = new Set(state.unavailableIds);
      for (const id of action.ids) {
        if (!items[id]) continue;
        const product = found.get(id);
        if (product) { items[id] = { ...items[id], product }; unavailableIds.delete(id); }
        else unavailableIds.add(id);
      }
      return { items, unavailableIds };
    }
  }
}

export function isCartItemValid(item: CartItem, product: Product | undefined): boolean {
  const quantity = Number(item.quantity);
  return Boolean(product && /^\d+$/.test(item.quantity) && Number.isSafeInteger(quantity)
    && quantity > 0 && quantity <= product.stock_quantity);
}

export function calculateCheckout(state: CartState, cashInput: string) {
  const cartItems = Object.values(state.items);
  const productById = new Map(cartItems.filter((item) => !state.unavailableIds.has(item.product.id))
    .map((item) => [item.product.id, item.product]));
  const totalCents = cartItems.reduce((sum, item) => {
    const quantity = Number(item.quantity);
    return sum + (Number.isSafeInteger(quantity) && quantity > 0 ? moneyCents(item.product.price) * quantity : 0);
  }, 0);
  const cashCents = parseCashCents(cashInput);
  const cartValid = cartItems.length > 0 && cartItems.every((item) => isCartItemValid(item, productById.get(item.product.id)));
  return {
    cartItems, productById, totalCents, cashCents,
    changeCents: cashCents === null ? null : cashCents - totalCents,
    valid: cartValid && cashCents !== null && cashCents >= totalCents && Number.isSafeInteger(totalCents),
  };
}
