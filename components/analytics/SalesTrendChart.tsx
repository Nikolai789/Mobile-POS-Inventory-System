import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import type { AnalyticsResponse, TrendGranularity } from '../../frontend/types/analytics';
import { BUSINESS_TIME_ZONE } from '../../frontend/utils/businessTime';
import { formatMoney } from '../../frontend/utils/money';
import { analyticsColors as colors } from './theme';

function bucketLabel(bucket: string, granularity: TrendGranularity, detailed = false): string {
  if (granularity === 'hour') {
    return new Date(bucket).toLocaleTimeString('en-PH', {
      timeZone: BUSINESS_TIME_ZONE, hour: 'numeric', ...(detailed ? { minute: '2-digit' } : {}),
    });
  }
  const date = new Date(`${bucket}${granularity === 'month' ? '-01' : ''}T00:00:00+08:00`);
  return date.toLocaleDateString('en-PH', {
    timeZone: BUSINESS_TIME_ZONE, month: 'short',
    ...(granularity === 'month' ? { year: 'numeric' as const } : { day: 'numeric' as const }),
  });
}

function transactionLabel(count: number): string {
  return `${count} ${count === 1 ? 'transaction' : 'transactions'}`;
}

export default function SalesTrendChart({ trend }: { trend: AnalyticsResponse['sales_trend'] }) {
  const [width, setWidth] = useState(280);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const { points, granularity } = trend;
  const maximum = points.reduce((highest, point) => Math.max(highest, point.total_sales), 0);
  const selected = points.find((point) => point.bucket === selectedBucket)
    || points.find((point) => point.total_sales === maximum);
  const chartWidth = Math.max(width, points.length * 44);
  const slotWidth = chartWidth / Math.max(points.length, 1);
  const interval = granularity === 'hour' ? 'Hourly' : granularity === 'day' ? 'Daily' : 'Monthly';

  return <View style={styles.card}>
    <Text accessibilityRole="header" style={styles.title}>Sales trend</Text>
    <Text style={styles.muted}>{interval} sales in Philippine time · PHP</Text>
    <Text style={styles.scale}>Maximum: {formatMoney(maximum)}</Text>
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <ScrollView horizontal showsHorizontalScrollIndicator={chartWidth > width}>
        <View style={[styles.bars, { width: chartWidth }]}>
          {points.map((point) => {
            const height = maximum > 0 ? point.total_sales / maximum * 128 : 0;
            const active = selected?.bucket === point.bucket;
            return <Pressable
              key={point.bucket}
              style={[styles.barSlot, { width: slotWidth }]}
              onPress={() => setSelectedBucket(point.bucket)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${bucketLabel(point.bucket, granularity, true)}: ${formatMoney(point.total_sales)}, ${transactionLabel(point.transaction_count)}`}
            >
              <Svg width={slotWidth} height={164} aria-hidden>
                {[16, 80, 144].map((y) => <Line key={y} x1={0} x2={slotWidth} y1={y} y2={y} stroke={colors.border} strokeDasharray={y === 144 ? undefined : '3 4'} />)}
                <Rect x={(slotWidth - 26) / 2} y={144 - height} width={26} height={height} rx={4} fill={active ? colors.primary : colors.bar} />
              </Svg>
              <Text style={[styles.axisLabel, active && styles.activeLabel]}>{bucketLabel(point.bucket, granularity)}</Text>
            </Pressable>;
          })}
        </View>
      </ScrollView>
    </View>
    {selected ? <View style={styles.selection} accessibilityLiveRegion="polite">
      <Text style={styles.selectionLabel}>{bucketLabel(selected.bucket, granularity, true)}</Text>
      <Text style={styles.selectionValue}>{formatMoney(selected.total_sales)}</Text>
      <Text style={styles.muted}>{transactionLabel(selected.transaction_count)}</Text>
    </View> : null}
    <Text style={styles.hint}>Tap a bar for details.{chartWidth > width ? ' Swipe to see more.' : ''}</Text>
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 6 },
  title: { color: colors.text, fontSize: 19, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 12 },
  scale: { color: colors.muted, fontSize: 11, marginTop: 12 },
  bars: { flexDirection: 'row' },
  barSlot: { alignItems: 'center', paddingBottom: 10 },
  axisLabel: { color: colors.muted, fontSize: 10, textAlign: 'center', paddingHorizontal: 2 },
  activeLabel: { color: colors.primary, fontWeight: '800' },
  selection: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, backgroundColor: colors.background, borderRadius: 10, padding: 12, marginTop: 8 },
  selectionLabel: { color: colors.text, fontSize: 13, fontWeight: '600' },
  selectionValue: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  hint: { color: colors.muted, fontSize: 11, marginTop: 6 },
});
