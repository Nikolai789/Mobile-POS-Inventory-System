import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export default function OrdersHeader({ error, pendingSale, loading, submitting, onRefresh }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Process Orders</Text>
      <Text style={styles.muted}>Select products, then enter the cash received.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {pendingSale ? <Text style={styles.muted}>This sale is awaiting confirmation. Retry it before changing the cart.</Text> : null}
      <Pressable onPress={onRefresh} disabled={loading || submitting} style={styles.linkButton}>
        <Text style={styles.linkText}>{loading ? 'Refreshing products...' : 'Refresh products'}</Text>
      </Pressable>
      <Text style={styles.sectionTitle}>Available products</Text>
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
  }
);
