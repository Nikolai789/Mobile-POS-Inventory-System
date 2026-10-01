import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useInventory } from "../../hooks/useInventory";

export default function Inventory() {
  const router = useRouter();
  const {
    products,
    name,
    sku,
    price,
    stock,
    editingProductId,
    setName,
    setSku,
    setPrice,
    setStock,
    clearForm,
    saveProduct,
    editProductForm,
    deleteProduct,
  } = useInventory();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inventory</Text>
      <Text style={styles.body}>Products are stored locally in SQLite.</Text>
      <TextInput placeholder="Product name" value={name} onChangeText={setName} style={styles.input} />
      <TextInput placeholder="SKU" value={sku} onChangeText={setSku} style={styles.input} autoCapitalize="characters" />
      <View style={styles.row}>
        <TextInput placeholder="Price" value={price} onChangeText={setPrice} style={[styles.input, styles.halfInput]} keyboardType="decimal-pad" />
        <TextInput placeholder="Stock" value={stock} onChangeText={setStock} style={[styles.input, styles.halfInput]} keyboardType="number-pad" />
      </View>
      <Pressable style={styles.button} onPress={saveProduct}>
        <Text style={styles.buttonText}>{editingProductId === null ? "Add product" : "Update product"}</Text>
      </Pressable>
      {editingProductId !== null && (
        <Pressable style={styles.cancelButton} onPress={clearForm}>
          <Text style={styles.cancelButtonText}>Cancel edit</Text>
        </Pressable>
      )}
      <FlatList
        data={products}
        keyExtractor={(product) => String(product.id)}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text style={styles.empty}>No products yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.product}>
            <View style={styles.productDetails}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productMeta}>{item.sku} | ₱{item.price.toFixed(2)} | {item.stock} in stock</Text>
            </View>
            <View style={styles.productActions}>
            <Pressable style={styles.actionButton} onPress={() => editProductForm(item)}>
              <Text style={styles.editText}>Edit</Text>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={() => deleteProduct(item)}>
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
            </View>
          </View>
        )}
      />

      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "flex-start", 
    padding: 20, 
    backgroundColor: "#fff" 
},
  title: { 
    fontSize: 24, 
    fontWeight: "bold", 
    marginBottom: 8 
},
  body: { 
    fontSize: 14, 
    color: "#666", 
    marginBottom: 24 
},
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    width: "100%",
  },
  row: { 
    flexDirection: "row",
    gap: 10,
    width: "100%"
  },
  halfInput: {
    flex: 1,
    width: undefined 
  },
  list: { 
    flex: 1,
    width: "100%", 
    marginTop: 16 
  },
  empty: { 
    textAlign: "center", 
    color: "#666", 
    padding: 20 
  },
  product: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 12,
  },
  productDetails: {
    flex: 1,
    marginRight: 8,
  },
  productActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  productName: { 
    fontSize: 16, 
    fontWeight: "600" 
  },
  productMeta: { 
    color: "#666", 
    marginTop: 4 
  },
  deleteText: { 
    color: "#b91c1c", 
    fontWeight: "600" 
  },
  editText: { 
    color: "#1d4ed8", 
    fontWeight: "600" 
  },
  cancelButton: { 
    paddingVertical: 8, 
    marginBottom: 8 
  },
  cancelButtonText: { 
    color: "#666", 
    fontWeight: "600" 
  },
  button: { 
    backgroundColor: "#1e1e2e", 
    paddingVertical: 12, 
    paddingHorizontal: 24, 
    borderRadius: 8, 
    marginBottom: 12, 
    width: 220, 
    alignItems: "center" 
},
  buttonText: { 
    color: "#fff", 
    fontWeight: "600" 
},
  backButton: { 
    paddingVertical: 10 
},
  backButtonText: { 
    color: "#1e1e2e", 
    fontWeight: "600" 
},
});
