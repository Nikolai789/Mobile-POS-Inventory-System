import { useCallback, useEffect, useState } from "react";
import { Alert, Keyboard } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import {
  createProduct,
  editProduct,
  getInventory,
  removeProduct,
} from "../services/inventoryService";
import type { Product } from "../db/database";

export function useInventory() {
  const db = useSQLiteContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  const loadProducts = useCallback(async () => {
    setProducts(await getInventory(db));
  }, [db]);

  useEffect(() => {
    loadProducts().catch(() => Alert.alert("Error", "Could not load inventory."));
  }, [loadProducts]);

  const clearForm = useCallback(() => {
    setName("");
    setSku("");
    setPrice("");
    setStock("");
    setEditingProductId(null);
  }, []);

  const saveProduct = useCallback(async () => {
    const parsedPrice = Number(price);
    const parsedStock = Number(stock);

    if (!name.trim() || !sku.trim() || !Number.isFinite(parsedPrice) || !Number.isInteger(parsedStock)) {
      Alert.alert("Check product details", "Enter a name, SKU, price, and whole-number stock quantity.");
      return;
    }

    try {
      const product = {
        name: name.trim(),
        sku: sku.trim(),
        price: parsedPrice,
        stock: parsedStock,
      };

      if (editingProductId === null) {
        await createProduct(db, product);
      } else {
        await editProduct(db, { id: editingProductId, ...product });
      }

      clearForm();
      Keyboard.dismiss();
      await loadProducts();
    } catch {
      Alert.alert("Could not save product", "The SKU may already exist.");
    }
  }, [clearForm, db, editingProductId, loadProducts, name, price, sku, stock]);

  const editProductForm = useCallback((product: Product) => {
    setEditingProductId(product.id);
    setName(product.name);
    setSku(product.sku);
    setPrice(String(product.price));
    setStock(String(product.stock));
  }, []);

  const deleteProduct = useCallback((product: Product) => {
    Alert.alert("Delete product?", product.name, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await removeProduct(db, product.id);
          await loadProducts();
        },
      },
    ]);
  }, [db, loadProducts]);

  return {
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
  };
}