import { colors } from '../../../shared/theme';
import type { SaleRequest } from '../../../../shared/contracts';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import ProductSearchBar from '../../catalog/components/ProductSearchBar';

interface OrdersHeaderProps {
  error: string;
  catalogError: string;
  query: string;
  onQueryChange: (value: string) => void;
  pendingSale: SaleRequest | null;
  loading: boolean;
  submitting: boolean;
  onRefresh: () => void;
  onScanBarcode: () => void;
}

export default function OrdersHeader({
  error, catalogError, query, onQueryChange, pendingSale, loading, submitting,
  onRefresh, onScanBarcode,
}: OrdersHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Process Orders</Text>
      <Text style={styles.muted}>Select products, then enter the cash received.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {catalogError ? <Text style={styles.error}>{catalogError}</Text> : null}
      {pendingSale ? <Text style={styles.muted}>This sale is awaiting confirmation. Retry it before changing the cart.</Text> : null}
      <Pressable onPress={onRefresh} disabled={loading || submitting} style={styles.linkButton}>
        <Text style={styles.linkText}>{loading ? 'Refreshing products...' : 'Refresh products'}</Text>
      </Pressable>
      <Text style={styles.sectionTitle}>Available products</Text>
      <ProductSearchBar value={query} onChangeText={onQueryChange} />
      <Pressable
        accessibilityRole="button"
        onPress={onScanBarcode}
        disabled={Boolean(pendingSale) || submitting}
        style={[styles.scanButton, (pendingSale || submitting) && styles.disabled]}
      >
        <Text style={styles.scanText}>Scan barcode</Text>
      </Pressable>
      {loading ? <ActivityIndicator accessibilityLabel="Loading products" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
    header: { 
        gap: 10, 
        marginBottom: 12 
    },
    title: { 
        fontSize: 28, 
        fontWeight: '700' 
    },
    sectionTitle: { 
        fontSize: 20, 
        fontWeight: '700', 
        marginTop: 12 
    },
    muted: { 
        color: '#555' 
    },
    error: { 
        color: '#b00020', 
        marginTop: 4 
    },
    linkButton: { 
        alignSelf: 'flex-start', 
        paddingVertical: 7 
    },
    linkText: { 
        color: '#1759a7', 
        fontWeight: '600' 
    },
    scanButton: { alignSelf: 'flex-start', backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12 },
    scanText: { color: '#fff', fontWeight: '700' },
    disabled: { opacity: 0.45 },
  }
);
