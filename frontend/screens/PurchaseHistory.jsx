import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, StyleSheet, Text, View } from 'react-native';
import { createSale, getProducts } from '../api/client';
import HeroCard from '../../components/herocard';
import { fontStyle } from '../../assets/branding/font';
import ReportCard from '../../components/maincard';
import { general_layout } from '../../assets/branding/layout';

export default function PurchaseHistory() {
  return (
    <View style={general_layout.layout}>

      <Text style={fontStyle.subZenFont1}>Purchase History</Text>
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
