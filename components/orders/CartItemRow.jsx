import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { formatMoney } from '../../frontend/utils/money';

export default function CartItemRow({ product, quantity, valid, maxQuantity, disabled, onQuantityChange, onRemove }) {
  return (
    <View style={styles.cartRow}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.muted}>{formatMoney(product.price)} each</Text>
        {!valid ? <Text style={styles.error}>Enter 1-{maxQuantity}, or remove this item.</Text> : null}
      </View>
      <TextInput
        accessibilityLabel={`Quantity for ${product.name}`}
        style={styles.quantityInput}
        keyboardType="number-pad"
        value={quantity}
        editable={!disabled}
        onChangeText={onQuantityChange}
      />
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
