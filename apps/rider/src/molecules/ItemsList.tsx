import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/atoms/Card';
import { SectionLabel } from '@/atoms/SectionLabel';
import { OrderItem } from '@/types';

function formatCurrency(amount: string | number): string {
  return `₦${parseFloat(String(amount)).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
}

interface ItemsListProps {
  items: OrderItem[];
  total: string;
}

export function ItemsList({ items, total }: ItemsListProps) {
  return (
    <Card>
      <SectionLabel>Items ({items.length})</SectionLabel>
      {items.map((item) => (
        <View key={item.id} style={styles.row}>
          <View style={styles.left}>
            <Text style={styles.qty}>{item.qty}×</Text>
            <Text style={styles.name}>{item.product_name}</Text>
          </View>
          <Text style={styles.price}>
            {formatCurrency(parseFloat(String(item.unit_price_ngn)) * item.qty)}
          </Text>
        </View>
      ))}
      <View style={styles.divider} />
      <View style={styles.row}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalAmount}>{formatCurrency(total)}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  left: { flexDirection: 'row', gap: 8, flex: 1 },
  qty: { fontSize: 14, fontWeight: '700', color: '#1B4332', minWidth: 28 },
  name: { fontSize: 14, color: '#1B1B1B', flex: 1 },
  price: { fontSize: 14, color: '#1B1B1B', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F4EAC8', marginVertical: 8 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#1B1B1B' },
  totalAmount: { fontSize: 15, fontWeight: '700', color: '#1B4332' },
});
