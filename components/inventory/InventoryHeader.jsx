import { Button, StyleSheet, Text, View } from 'react-native';

export default function InventoryHeader({ onAddProduct, onScanBarcode, scanDisabled }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Inventory</Text>
      <View style={styles.actions}>
        <Button title="Add product" onPress={onAddProduct} />
        <Button title="Scan barcode" onPress={onScanBarcode} disabled={scanDisabled} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    header: { 
      gap: 8 
    },
    actions: { 
      flexDirection: 'row', 
      flexWrap: 'wrap', 
      alignItems: 'center', 
      gap: 8 
    },
    title: { 
      fontSize: 28, 
      fontWeight: '700' 
    },
  }
);
