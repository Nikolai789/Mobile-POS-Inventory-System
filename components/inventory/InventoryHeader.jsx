import { Button, StyleSheet, Text, View } from 'react-native';

export default function InventoryHeader({ onAddProduct }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Inventory</Text>
      <Button title="Add product" onPress={onAddProduct} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 28, fontWeight: '700' },
});
