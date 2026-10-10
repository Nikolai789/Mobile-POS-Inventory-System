import { Button, Modal, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ProductFormModal({ visible, mode, form, saving, error, onChange, onSave, onClose }) {
  const title = mode === 'restore' ? 'Restore product' : mode === 'edit' ? 'Edit product' : 'Add product';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modal}>
        <Text style={styles.title}>{title}</Text>
        {mode === 'restore' ? <Text>Enter the current stock quantity before restoring this product.</Text> : null}
        <TextInput
          style={styles.formInput}
          placeholder="Name"
          value={form.name}
          onChangeText={(name) => onChange({ name })}
        />
        <TextInput
          style={styles.formInput}
          placeholder="Barcode"
          value={form.barcode}
          onChangeText={(barcode) => onChange({ barcode })}
        />
        <TextInput
          style={styles.formInput}
          placeholder="Price (PHP)"
          keyboardType="decimal-pad"
          value={form.price}
          onChangeText={(price) => onChange({ price })}
        />
        <TextInput
          style={styles.formInput}
          placeholder="Stock quantity"
          keyboardType="number-pad"
          value={form.stock_quantity}
          onChangeText={(stock_quantity) => onChange({ stock_quantity })}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title={saving ? 'Saving...' : mode === 'restore' ? 'Restore product' : 'Save'} onPress={onSave} disabled={saving} />
        <Button title="Cancel" onPress={onClose} disabled={saving} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
    modal: { 
      flex: 1, 
      padding: 20, 
      gap: 14, 
      justifyContent: 'center' 
    },
    title: { 
      fontSize: 28, 
      fontWeight: '700' 
    },
    formInput: { 
      borderWidth: 1, 
      borderColor: '#aaa', 
      borderRadius: 4, 
      padding: 12 
    },
    error: { color: '#b00020' },
  }
);
