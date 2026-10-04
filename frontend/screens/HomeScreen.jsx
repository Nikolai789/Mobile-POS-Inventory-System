import { View, Text, StyleSheet } from 'react-native';
import HeroCard from '../../components/herocard';
import Colors from '../../assets/branding/color_scheme';
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        <HeroCard label="Items Tracked" value={32} color="#84e63c" />
        <HeroCard label="Expenses" value="$321.20" color="#ecd04f" />
        <HeroCard label="Low Stock" value={12} color="#ee5252" />

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
});
