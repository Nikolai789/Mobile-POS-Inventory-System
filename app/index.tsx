import { View, Text, Pressable, StyleSheet } from "react-native";
import { Link } from "expo-router";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>App Template</Text>
      <Text style={styles.subtitle}>Stack navigation starter</Text>

      <Link href="screens/purchases" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>process purchases</Text>
        </Pressable>
      </Link>

      <Link href="screens/Inventory" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Inventory</Text>
        </Pressable>
      </Link>

      <Link href="screens/settings" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Settings</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 28 },
  button: { backgroundColor: "#1e1e2e", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, marginVertical: 6, width: 220, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600" },
});