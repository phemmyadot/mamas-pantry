import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Order } from '@/types';

function formatCurrency(amount: string): string {
  return `₦${parseFloat(amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
}

function maskPhone(phone: string): string {
  return `***${phone.slice(-4)}`;
}

function openMaps(address: string) {
  const encoded = encodeURIComponent(address);
  const appleUrl = `maps:?q=${encoded}`;
  const googleUrl = `https://maps.google.com/?q=${encoded}`;

  Linking.canOpenURL(appleUrl).then((canOpen) => {
    Linking.openURL(canOpen ? appleUrl : googleUrl);
  });
}

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { data: order, isLoading, isError } = useQuery<Order>({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data } = await api.get<Order[]>('/riders/me/orders');
      const found = data.find((o) => o.id === orderId);
      if (!found) throw new Error('Order not found');
      return found;
    },
    enabled: !!orderId,
  });

  const { mutate: markDelivered, isPending: isMarking } = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch<Order>(`/riders/me/orders/${orderId}/delivered`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      setShowConfirmModal(false);
      Alert.alert('Delivered!', 'Order marked as delivered.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (err: any) => {
      setShowConfirmModal(false);
      const detail = err?.response?.data?.detail ?? 'Could not mark order as delivered.';
      Alert.alert('Error', detail);
    },
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1B4332" />
      </View>
    );
  }

  if (isError || !order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Order not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const addr = order.delivery_address;
  const fullAddress = [addr.address, addr.area, addr.city].filter(Boolean).join(', ');

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Order Detail</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Order ID + status */}
        <View style={styles.section}>
          <Text style={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Out for delivery</Text>
          </View>
        </View>

        {/* Customer */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Customer</Text>
          <Text style={styles.customerName}>{addr.name}</Text>
          <Text style={styles.customerPhone}>Phone ends in {maskPhone(addr.phone)}</Text>
        </View>

        {/* Delivery address */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Delivery Address</Text>
          <Text style={styles.addressText}>{fullAddress}</Text>
          <Pressable style={styles.navigateButton} onPress={() => openMaps(fullAddress)}>
            <Text style={styles.navigateButtonText}>Navigate</Text>
          </Pressable>
        </View>

        {/* Items */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Items ({order.items.length})</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemQty}>{item.qty}×</Text>
                <Text style={styles.itemName}>{item.product_name}</Text>
              </View>
              <Text style={styles.itemPrice}>
                {formatCurrency(String(parseFloat(item.unit_price_ngn as any) * item.qty))}
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.itemRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{formatCurrency(order.total_ngn)}</Text>
          </View>
        </View>

        {/* Notes */}
        {order.notes ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <Text style={styles.notesText}>{order.notes}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Mark as delivered */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.deliverButton, isMarking && styles.buttonDisabled]}
          onPress={() => setShowConfirmModal(true)}
          disabled={isMarking}
        >
          {isMarking ? (
            <ActivityIndicator color="#FEFAE0" />
          ) : (
            <Text style={styles.deliverButtonText}>Mark as Delivered</Text>
          )}
        </Pressable>
      </View>

      {/* Confirmation modal */}
      <Modal transparent visible={showConfirmModal} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Confirm Delivery</Text>
            <Text style={styles.modalBody}>
              Verify the customer — their phone ends in{' '}
              <Text style={styles.phoneHighlight}>{maskPhone(addr.phone)}</Text>.
            </Text>
            <Text style={styles.modalBody}>
              Mark order <Text style={styles.bold}>#{order.id.slice(0, 8).toUpperCase()}</Text> as delivered?
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.modalBtnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnConfirm]}
                onPress={() => markDelivered()}
              >
                <Text style={styles.modalBtnConfirmText}>Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FEFAE0' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: '#FEFAE0' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1B4332',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { width: 60 },
  backBtnText: { color: '#B7E4C7', fontSize: 16 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FEFAE0' },
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  section: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orderId: { fontSize: 18, fontWeight: '800', color: '#1B1B1B', fontFamily: 'monospace', flex: 1 },
  statusBadge: {
    backgroundColor: '#FEFAE0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 0.5,
    borderColor: '#F4EAC8',
  },
  statusText: { fontSize: 12, fontWeight: '600', color: '#7a5500' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 6,
    borderWidth: 0.5,
    borderColor: '#F4EAC8',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5C5C5C',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  customerName: { fontSize: 16, fontWeight: '600', color: '#1B1B1B' },
  customerPhone: { fontSize: 14, color: '#5C5C5C' },
  addressText: { fontSize: 14, color: '#1B1B1B', lineHeight: 20 },
  navigateButton: {
    marginTop: 8,
    backgroundColor: '#1B4332',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  navigateButtonText: { color: '#FEFAE0', fontWeight: '600', fontSize: 14 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemLeft: { flexDirection: 'row', gap: 8, flex: 1 },
  itemQty: { fontSize: 14, fontWeight: '700', color: '#1B4332', minWidth: 28 },
  itemName: { fontSize: 14, color: '#1B1B1B', flex: 1 },
  itemPrice: { fontSize: 14, color: '#1B1B1B', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#F4EAC8', marginVertical: 8 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#1B1B1B' },
  totalAmount: { fontSize: 15, fontWeight: '700', color: '#1B4332' },
  notesText: { fontSize: 14, color: '#1B1B1B', lineHeight: 20 },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderTopColor: '#F4EAC8',
  },
  deliverButton: {
    backgroundColor: '#2D6A4F',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  deliverButtonText: { color: '#FEFAE0', fontSize: 16, fontWeight: '700' },
  errorText: { fontSize: 15, color: '#C4622D' },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1B4332',
    borderRadius: 8,
  },
  backButtonText: { color: '#FEFAE0', fontWeight: '600' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(27,27,27,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: '#FEFAE0',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    gap: 12,
    borderWidth: 0.5,
    borderColor: '#F4EAC8',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1B1B1B' },
  modalBody: { fontSize: 14, color: '#1B1B1B', lineHeight: 20 },
  phoneHighlight: { fontWeight: '700', color: '#1B4332' },
  bold: { fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  modalBtnCancel: { backgroundColor: '#F4EAC8' },
  modalBtnCancelText: { fontWeight: '600', color: '#5C5C5C' },
  modalBtnConfirm: { backgroundColor: '#2D6A4F' },
  modalBtnConfirmText: { fontWeight: '700', color: '#FEFAE0' },
});
