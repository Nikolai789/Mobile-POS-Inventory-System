import { View, Text, StyleSheet } from 'react-native';
import HeroCard from '../../components/herocard';
import { fontStyle } from '../../assets/branding/font';
import ReportCard from '../../components/maincard';
import { general_layout } from '../../assets/branding/layout';

export default function HomeScreen() {
  return (
    <View style={general_layout.layout}>

      <Text style={fontStyle.subZenFont1}>Dashboard</Text>
      <View style={styles.grid}>
        <HeroCard label="Items Tracked" value={32} color="#84e63c" />
        <HeroCard label="Expenses" value="$321.20" color="#ecd04f" />
        <HeroCard label="Low Stock" value={12} color="#ee5252" />
        <HeroCard label="Low Stock" value={12} color="#ee5252" />
      </View>

      <ReportCard title= 'Sales Report' rows={[
        { name: 'Water Bottle', sold: 31, profit: '$301' },
        { name: 'Notebook', sold: 12, profit: '$84' },
        { name: 'Notebook', sold: 12, profit: '$84' },
        { name: 'Notebook', sold: 12, profit: '$84' }]}
      ></ReportCard>
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
