import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ProductSearchBar({ value, onChangeText,
  accessibilityLabel = 'Search products by name or barcode', placeholder = 'Search name or barcode' }) {
  return (
    <View style={styles.row}>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
        onChangeText={onChangeText}
        placeholder={placeholder}
        returnKeyType="search"
        submitBehavior="blurAndSubmit"
        style={styles.input}
        value={value}
      />
      {value ? <Pressable accessibilityLabel="Clear search" accessibilityRole="button" onPress={() => onChangeText('')} style={styles.clear}>
        <Text style={styles.clearText}>Clear</Text>
      </Pressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
    row: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      borderWidth: 1, 
      borderColor: '#aaa', 
      borderRadius: 8, 
      backgroundColor: '#fff' 
    },
    input: { 
      flex: 1, 
      minHeight: 48, 
      paddingHorizontal: 12, 
      fontSize: 16 
    },
    clear: { 
      paddingHorizontal: 12, 
      paddingVertical: 14 
    },
    clearText: { 
      color: '#1759a7', 
      fontWeight: '600' 
    },
  }
);
