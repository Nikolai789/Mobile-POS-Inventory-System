import { colors } from '../../../shared/theme';
import type { Product, SaleRequest } from '../../../../shared/contracts';
import { isCartItemValid, type CartItem } from '../model/cart';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { formatMoney } from '../../../shared/utils/money';
import CartItemRow from './CartItemRow';

interface CheckoutPanelProps {
  cartItems: CartItem[];
  productById: Map<number, Product>;
  totalCents: number;
  cashInput: string;
  cashCents: number | null;
  changeCents: number | null;
  pendingSale: SaleRequest | null;
  submitting: boolean;
  canFinalize: boolean;
  onQuantityChange: (id: number, quantity: string) => void;
  onRemove: (id: number) => void;
  onCashChange: (value: string) => void;
  onCashFocus: () => void;
  onCashBlur: () => void;
  onFinalize: () => void;
}

export default function CheckoutPanel({
  cartItems,
  productById,
  totalCents,
  cashInput,
  cashCents,
  changeCents,
  pendingSale,
  submitting,
  canFinalize,
  onQuantityChange,
  onRemove,
  onCashChange,
  onCashFocus,
  onCashBlur,
  onFinalize,
}: CheckoutPanelProps) {
  const inputDisabled = Boolean(pendingSale) || submitting;
  const finalizeDisabled = submitting || (!canFinalize && !pendingSale);

  return (
    <View style={styles.checkout}>
      <Text style={styles.sectionTitle}>Current sale</Text>
      {cartItems.length === 0 ? <Text style={styles.muted}>No items selected.</Text> : cartItems.map((item) => {
        const currentProduct = productById.get(item.product.id);
        const product = currentProduct || item.product;
        const valid = isCartItemValid(item, currentProduct);
        return (
          <CartItemRow
            key={item.product.id}
            product={product}
            quantity={item.quantity}
            valid={valid}
            maxQuantity={currentProduct?.stock_quantity || 0}
            disabled={inputDisabled}
            onQuantityChange={(value) => onQuantityChange(item.product.id, value)}
            onRemove={() => onRemove(item.product.id)}
          />
        );
      })}
      <View style={styles.totalRow}><Text style={styles.totalText}>Total</Text><Text style={styles.totalText}>{formatMoney(totalCents / 100)}</Text></View>
      <Text style={styles.label}>Cash received (PHP)</Text>
      <TextInput
        accessibilityLabel="Cash received"
        style={styles.cashInput}
        keyboardType="decimal-pad"
        placeholder="0.00"
        value={cashInput}
        editable={!inputDisabled}
        onChangeText={onCashChange}
        onFocus={onCashFocus}
        onBlur={onCashBlur}
      />
      <View style={styles.totalRow}><Text>Change</Text><Text>{formatMoney(Math.max(0, changeCents || 0) / 100)}</Text></View>
      {cashCents != null && cashCents < totalCents ? <Text style={styles.error}>Cash received is less than the total.</Text> : null}
      <Pressable
        accessibilityRole="button"
        onPress={onFinalize}
        disabled={finalizeDisabled}
        style={[styles.finalizeButton, finalizeDisabled && styles.disabled]}
      >
        <Text style={styles.finalizeText}>{submitting ? 'Saving sale...' : pendingSale ? 'Retry sale' : 'Finalize sale'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
    checkout: { 
        backgroundColor: '#fff', 
        borderRadius: 10, 
        padding: 16, 
        marginTop: 18, 
        gap: 12 
    },
    sectionTitle: { 
        fontSize: 20, 
        fontWeight: '700', 
        marginTop: 12 
    },
    muted: { 
        color: '#555' 
    },
    error: { 
        color: '#b00020', 
        marginTop: 4 
    },
    totalRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between' 
    },
    totalText: { 
        fontSize: 20, 
        fontWeight: '700' 
    },
    label: { 
        fontWeight: '600' 
    },
    cashInput: { 
        borderWidth: 1, 
        borderColor: '#999', 
        borderRadius: 6, 
        padding: 12, 
        fontSize: 18 
    },
    finalizeButton: { 
        backgroundColor: colors.primary, 
        borderRadius: 8, 
        alignItems: 'center', 
        padding: 15 
    },
    finalizeText: { 
        color: '#fff', 
        fontWeight: '700', 
        fontSize: 16 
    },
    disabled: { 
        opacity: 0.45 
    },
  }
);
