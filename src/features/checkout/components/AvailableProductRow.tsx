import { colors } from '../../../shared/theme';
import type { Product } from '../../../../shared/contracts';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatMoney } from '../../../shared/utils/money';

interface AvailableProductRowProps {
  product: Product;
  disabled: boolean;
  onAdd: () => void;
}

export default function AvailableProductRow({ product, disabled, onAdd }: AvailableProductRowProps) {
  return (
    <View style={styles.productRow}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.muted}>{formatMoney(product.price)} · {product.stock_quantity} in stock</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onAdd}
        disabled={disabled}
        style={[styles.addButton, disabled && styles.disabled]}
      >
        <Text style={styles.addText}>Add</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
    productRow: { 
        backgroundColor: '#fff', 
        padding: 14, 
        borderRadius: 10, 
        marginBottom: 8, 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 12 
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
    addButton: { 
        backgroundColor: colors.primary, 
        borderRadius: 8, 
        paddingHorizontal: 17, 
        paddingVertical: 11 
    },
    addText: { 
        color: '#fff', 
        fontWeight: '700' 
    },
    disabled: { 
        opacity: 0.45 
    },
  }
);
