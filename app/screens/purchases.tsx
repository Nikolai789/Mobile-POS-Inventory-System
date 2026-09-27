import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function Home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Process Purchases</Text>
      <Text style={styles.body}>This is the sales in the stack.</Text>


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
    justifyContent: "center", 
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