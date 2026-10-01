import { Stack } from "expo-router/stack";
import { SQLiteProvider } from "expo-sqlite";
import { migrateDbIfNeeded } from "../db/database";
import Logo from '.././assets/App Assets/icon.svg';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="pos.db" onInit={migrateDbIfNeeded}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#1e1e2e" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle: { backgroundColor: "#fff" },
        }}
      >
        <Stack.Screen name="index" options={{ headerTitle: () => <Logo/> }} />
        <Stack.Screen name="screens/purchases" options={{ title: "Purchases" }} />
        <Stack.Screen name="screens/Inventory" options={{ title: "Inventory" }} />
        <Stack.Screen name="screens/settings" options={{ title: "Settings" }} />
      </Stack>
    </SQLiteProvider>
  );
}
