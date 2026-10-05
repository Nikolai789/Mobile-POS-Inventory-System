import { View, Text, Pressable } from 'react-native';
import { Colors } from '../assets/branding/color_scheme';
import { main_card } from '../assets/branding/layout';

type Row = { name: string; sold: number; profit: string };

type Props = {
  title: string;
  rows: Row[];
  variant?: 'color' | 'dark';
  onMore?: () => void;
  soldColor?: string;      // new
  profitColor?: string;    // new
};

export default function ReportCard({ title, rows, variant = 'color', onMore, soldColor, profitColor }: Props) {
  const dark = variant === 'dark';

  const soldPill = { backgroundColor: soldColor ?? (dark ? Colors.BGColorBlack : Colors.Caution) };
  const profitPill = { backgroundColor: profitColor ?? (dark ? Colors.BGColorBlack : Colors.Status) };
  const pillText = { color: dark ? '#fff' : Colors.BGColorBlack };

  return (
    <View style={main_card.card}>
      <View style={main_card.titleRow}>
        <Text style={main_card.title}>{title}</Text>
        <Pressable onPress={onMore}>
          <Text style={main_card.more}>More Details</Text>
        </Pressable>
      </View>

      <View style={main_card.row}>
        <View style={[main_card.pill, main_card.colName, { backgroundColor: Colors.BGColorWhite }]}>
          <Text style={[main_card.pillText, { color: Colors.BGColorBlack }]}>Name</Text>
        </View>
        <View style={[main_card.pill, main_card.colSold, soldPill]}>
          <Text style={[main_card.pillText, pillText]}>Sold</Text>
        </View>
        <View style={[main_card.pill, main_card.colProfit, profitPill]}>
          <Text style={[main_card.pillText, pillText]}>Profit</Text>
        </View>
      </View>

      {rows.map((r, i) => (
        <View key={i} style={main_card.row}>
          <Text style={[main_card.cell, main_card.colName]}>{r.name}</Text>
          <Text style={[main_card.cell, main_card.colSold]}>{r.sold}</Text>
          <Text style={[main_card.cell, main_card.colProfit]}>{r.profit}</Text>
        </View>
      ))}
    </View>
  );
}
