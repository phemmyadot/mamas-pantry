import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Order } from '@/types';
import { StatusPill } from '@/atoms/Badge';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface OrderCardProps {
  order: Order;
  onPress: () => void;
}

export function OrderCard({ order, onPress }: OrderCardProps) {
  const addr = order.delivery_address;
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
        <Text style={styles.time}>{formatDate(order.updated_at)}</Text>
      </View>
      <Text style={styles.customerName}>{addr.name}</Text>
      <Text style={styles.address} numberOfLines={2}>
        {addr.address}{addr.area ? `, ${addr.area}` : ''}, {addr.city}
      </Text>
      <View style={styles.footer}>
        <Text style={styles.itemCount}>
          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
        </Text>
        <StatusPill label="Out for delivery" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 4,
    borderWidth: 0.5,
    borderColor: '#F4EAC8',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  orderId: { fontSize: 13, fontWeight: '700', color: '#1B4332', fontFamily: 'monospace' },
  time: { fontSize: 12, color: '#5C5C5C' },
  customerName: { fontSize: 15, fontWeight: '600', color: '#1B1B1B' },
  address: { fontSize: 13, color: '#5C5C5C', lineHeight: 18 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  itemCount: { fontSize: 13, color: '#5C5C5C' },
});
