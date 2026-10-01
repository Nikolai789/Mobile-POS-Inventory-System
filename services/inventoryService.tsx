import type { SQLiteDatabase } from "expo-sqlite";
import {
	addProduct,
	deleteProduct,
	getProducts,
	updateProduct,
	type Product,
} from "../db/database";

export type ProductInput = Omit<Product, "id">;

export function getInventory(db: SQLiteDatabase) {
	return getProducts(db);
}

export function createProduct(db: SQLiteDatabase, product: ProductInput) {
	return addProduct(db, product);
}

export function editProduct(db: SQLiteDatabase, product: Product) {
	return updateProduct(db, product);
}

export function removeProduct(db: SQLiteDatabase, productId: number) {
	return deleteProduct(db, productId);
}
