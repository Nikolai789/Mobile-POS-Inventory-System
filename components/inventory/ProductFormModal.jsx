import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function FormField({ label, hint, value, onChangeText, keyboardType, error, editable }) {
  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      accessibilityLabel={label}
      autoCapitalize="none"
      autoCorrect={false}
      editable={editable}
      keyboardType={keyboardType}
      onChangeText={onChangeText}
      style={[styles.input, error && styles.inputError]}
      value={value}
    />
    {error ? <Text style={styles.fieldError}>{error}</Text> : <Text style={styles.hint}>{hint}</Text>}
  </View>;
}

export default function ProductFormModal({ visible, mode, form, saving, error, fieldErrors = {}, onChange, onSave, onClose }) {
  const title = mode === 'restore' ? 'Restore product' : mode === 'edit' ? 'Edit product' : 'Add product';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => { if (!saving) onClose(); }}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
          style={styles.keyboardArea}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.heading}>
              <Text style={styles.eyebrow}>PRODUCT DETAILS</Text>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{mode === 'restore'
                ? 'Review the product details and enter its current stock before restoring it.'
                : mode === 'edit' ? 'Update the details staff see in inventory and at checkout.'
                  : 'Add the details staff will see in inventory and at checkout.'}</Text>
            </View>
            <View style={styles.card}>
              <FormField label="Product name" hint="Use a name your staff can recognize quickly."
                value={form.name} onChangeText={(name) => onChange({ name })}
                error={fieldErrors.name} editable={!saving} />
              <FormField label="Barcode" hint="Enter the barcode printed on the product."
                value={form.barcode} onChangeText={(barcode) => onChange({ barcode })}
                error={fieldErrors.barcode} editable={!saving} />
              <FormField label="Price (PHP)" hint="Up to two decimal places."
                keyboardType="decimal-pad" value={form.price} onChangeText={(price) => onChange({ price })}
                error={fieldErrors.price} editable={!saving} />
              <FormField label={mode === 'restore' ? 'Current stock quantity' : 'Stock quantity'}
                hint="Use a whole number, including 0 for out of stock."
                keyboardType="number-pad" value={form.stock_quantity}
                onChangeText={(stock_quantity) => onChange({ stock_quantity })}
                error={fieldErrors.stock_quantity} editable={!saving} />
            </View>
            {error ? <View style={styles.errorBox}><Text style={styles.error}>{error}</Text></View> : null}
          </ScrollView>
          <View style={styles.footer}>
            <Pressable accessibilityRole="button" disabled={saving} onPress={onSave}
              style={[styles.saveButton, saving && styles.disabled]}>
              <Text style={styles.saveText}>{saving ? 'Saving...' : mode === 'restore' ? 'Restore product' : 'Save product'}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={saving} onPress={onClose}
              style={[styles.cancelButton, saving && styles.disabled]}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f7f4' },
  keyboardArea: { flex: 1 },
  content: { padding: 16, paddingBottom: 28, gap: 16 },
  heading: { gap: 5 },
  eyebrow: { color: '#35694d', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: '#18291f', fontSize: 30, fontWeight: '700' },
  subtitle: { color: '#647268', fontSize: 13, lineHeight: 19 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 18,
    borderWidth: 1, borderColor: '#e4ebe5' },
  field: { gap: 7 },
  label: { color: '#283b2e', fontSize: 14, fontWeight: '700' },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#cdd9cf', borderRadius: 10,
    paddingHorizontal: 13, color: '#18291f', backgroundColor: '#fff', fontSize: 16 },
  inputError: { borderColor: '#a22d21' },
  hint: { color: '#647268', fontSize: 12 },
  fieldError: { color: '#a22d21', fontSize: 12 },
  errorBox: { backgroundColor: '#fff1ee', borderRadius: 12, padding: 14 },
  error: { color: '#a22d21', fontSize: 13 },
  footer: { backgroundColor: '#fff', padding: 16, gap: 9, borderTopWidth: 1, borderTopColor: '#e4ebe5' },
  saveButton: { minHeight: 48, borderRadius: 10, backgroundColor: '#17663c',
    alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: '#526158', fontSize: 14, fontWeight: '700' },
  disabled: { opacity: 0.5 },
});
