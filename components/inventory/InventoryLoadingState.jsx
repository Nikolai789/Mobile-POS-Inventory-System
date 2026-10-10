import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function InventoryLoadingState() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
      <Text>Loading inventory...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
    center: { 
      flex: 1, 
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: 10 },
  }
);
