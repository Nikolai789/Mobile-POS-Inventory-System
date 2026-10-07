import { Button, StyleSheet, Text, View } from 'react-native';

export default function ProductRow({ product, deleting, onEdit, onArchive }) {
  return (
    <View style={styles.row}>
      <View style={styles.productInfo}>
        <Text style={styles.name}>{product.name}</Text>
        <Text>{product.barcode}  ${product.price.toFixed(2)}  |  {product.stock_quantity} in stock</Text>
      </View>
      <Button title="Edit" onPress={onEdit} disabled={deleting} />
      <Button
        title={deleting ? '...' : 'Archive'}
        onPress={onArchive}
        disabled={deleting}
        color="#b00020"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  productInfo: { flex: 1 },
  name: { fontSize: 17, fontWeight: '600' },
});
