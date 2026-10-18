import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { formatMoney } from '../../frontend/utils/money';

export default function CartItemRow({ product, quantity, valid, maxQuantity, disabled, onQuantityChange, onRemove }) {
  const numericQuantity = /^\d+$/.test(quantity) ? Number(quantity) : 0;
  const canDecrement = Number.isSafeInteger(numericQuantity) && numericQuantity > 1;
  const canIncrement = Number.isSafeInteger(numericQuantity)
    && numericQuantity > 0 && numericQuantity < maxQuantity;

  return (
    <View style={styles.cartRow}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.muted}>{formatMoney(product.price)} each</Text>
        {!valid ? <Text style={styles.error}>Enter 1-{maxQuantity}, or remove this item.</Text> : null}
      </View>
      <View style={styles.quantityControls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Decrease quantity for ${product.name}`}
          onPress={() => onQuantityChange(String(numericQuantity - 1))}
          disabled={disabled || !canDecrement}
          style={[styles.quantityButton, (disabled || !canDecrement) && styles.quantityButtonDisabled]}
        >
          <Text style={styles.quantityButtonText}>-</Text>
        </Pressable>
        <TextInput
          accessibilityLabel={`Quantity for ${product.name}`}
          style={styles.quantityInput}
          keyboardType="number-pad"
          value={quantity}
          editable={!disabled}
          onChangeText={onQuantityChange}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Increase quantity for ${product.name}`}
          onPress={() => onQuantityChange(String(numericQuantity + 1))}
          disabled={disabled || !canIncrement}
          style={[styles.quantityButton, (disabled || !canIncrement) && styles.quantityButtonDisabled]}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </Pressable>
      </View>
      <Pressable accessibilityRole="button" onPress={onRemove} disabled={disabled}>
        <Text style={styles.removeText}>Remove</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
    cartRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8, 
        paddingVertical: 7, 
        borderBottomWidth: 1, 
        borderBottomColor: '#eee' 
    },
    productInfo: { 
        flex: 1, 
        gap: 3 
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    quantityButton: {
        width: 34,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#999',
        borderRadius: 6,
    },
    quantityButtonDisabled: {
        opacity: 0.45,
    },
    quantityButtonText: {
        fontSize: 20,
        fontWeight: '600',
    },
    productName: { 
        fontSize: 16, 
        fontWeight: '600' 
    },
    muted: { 
        color: '#555' 
    },
    error: { 
        color: '#b00020', 
        marginTop: 4 
    },
    quantityInput: { 
        borderWidth: 1, 
        borderColor: '#999', 
        borderRadius: 6, 
        minWidth: 55, 
        padding: 8, 
        textAlign: 'center' 
    },
    removeText: { 
        color: '#b00020', 
        fontWeight: '600', 
        padding: 5 
    },
  }
);
