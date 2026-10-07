import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, StyleSheet, Text, View } from 'react-native';
import { createSale, getProducts } from '../api/client';
import HeroCard from '../../components/herocard';
import { fontStyle } from '../../assets/branding/font';
import ReportCard from '../../components/maincard';
import { general_layout } from '../../assets/branding/layout';
import { formatMoney } from '../utils/money';

export default function HomeScreen() {
  return (
    <View style={general_layout.layout}>

      <Text style={fontStyle.subZenFont1}>Dashboard</Text>
      <View style={styles.grid}>
        <HeroCard label="Items Tracked" value={32} color="#84e63c" />
        <HeroCard label="Expenses" value={formatMoney(321.20)} color="#ecd04f" />
        <HeroCard label="Low Stock" value={12} color="#ee5252" />
        <HeroCard label="Low Stock" value={12} color="#ee5252" />
      </View>

      <ReportCard title= 'Sales Report' rows={[
        { name: 'Water Bottle', sold: 31, profit: formatMoney(301) },
        { name: 'Notebook', sold: 12, profit: formatMoney(84) },
        { name: 'Notebook', sold: 12, profit: formatMoney(84) },
        { name: 'Notebook', sold: 12, profit: formatMoney(84) }]}
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
