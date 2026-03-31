import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useOrderDetail, useMarkDelivered } from '@/hooks/useOrderDetail';
import { AddressBlock } from '@/molecules/AddressBlock';
import { ConfirmModal } from '@/molecules/ConfirmModal';
import { SuccessModal } from '@/molecules/SuccessModal';
import { ItemsList } from '@/molecules/ItemsList';
import { Card } from '@/atoms/Card';
import { SectionLabel } from '@/atoms/SectionLabel';
import { LoadingScreen } from '@/atoms/LoadingScreen';

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: order, isLoading, isError } = useOrderDetail(orderId);
  const { mutate: markDelivered, isPending: isMarking } = useMarkDelivered(orderId, {
    onSuccess: () => {
      setShowConfirm(false);
      setShowSuccess(true);
    },
    onError: (detail) => {
      setShowConfirm(false);
      Alert.alert('Error', detail);
    },
  });

  if (isLoading) return <LoadingScreen />;

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
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Order Detail</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.idRow}>
          <Text style={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Out for delivery</Text>
          </View>
        </View>

        <Card>
          <SectionLabel>Customer</SectionLabel>
          <Text style={styles.customerName}>{addr.name}</Text>
          <Text style={styles.customerPhone}>Phone ends in ***{addr.phone.slice(-4)}</Text>
        </Card>

        <AddressBlock address={fullAddress} />

        <ItemsList items={order.items} total={order.total_ngn} />

        {order.notes ? (
          <Card>
            <SectionLabel>Notes</SectionLabel>
            <Text style={styles.notesText}>{order.notes}</Text>
          </Card>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.deliverButton, isMarking && styles.disabled]}
          onPress={() => setShowConfirm(true)}
          disabled={isMarking}
        >
          {isMarking ? (
            <ActivityIndicator color="#FEFAE0" />
          ) : (
            <Text style={styles.deliverButtonText}>Mark as Delivered</Text>
          )}
        </Pressable>
      </View>

      <ConfirmModal
        visible={showConfirm}
        orderId={order.id.slice(0, 8).toUpperCase()}
        phoneLastFour={addr.phone.slice(-4)}
        onConfirm={() => markDelivered()}
        onCancel={() => setShowConfirm(false)}
      />

      <SuccessModal
        visible={showSuccess}
        orderId={order.id.slice(0, 8).toUpperCase()}
        onDismiss={() => router.back()}
      />
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
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
  customerName: { fontSize: 16, fontWeight: '600', color: '#1B1B1B' },
  customerPhone: { fontSize: 14, color: '#5C5C5C' },
  notesText: { fontSize: 14, color: '#1B1B1B', lineHeight: 20 },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 0.5, borderTopColor: '#F4EAC8' },
  deliverButton: {
    backgroundColor: '#2D6A4F',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabled: { opacity: 0.6 },
  deliverButtonText: { color: '#FEFAE0', fontSize: 16, fontWeight: '700' },
  errorText: { fontSize: 15, color: '#C4622D' },
  backButton: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#1B4332', borderRadius: 8 },
  backButtonText: { color: '#FEFAE0', fontWeight: '600' },
});
