import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

interface ConfirmModalProps {
  visible: boolean;
  orderId: string;
  phoneLastFour: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ visible, orderId, phoneLastFour, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Confirm Delivery</Text>
          <Text style={styles.body}>
            Verify the customer — their phone ends in{' '}
            <Text style={styles.highlight}>***{phoneLastFour}</Text>.
          </Text>
          <Text style={styles.body}>
            Mark order <Text style={styles.bold}>#{orderId}</Text> as delivered?
          </Text>
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.cancel]} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.confirm]} onPress={onConfirm}>
              <Text style={styles.confirmText}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  title: { fontSize: 18, fontWeight: '700', color: '#1B1B1B' },
  body: { fontSize: 14, color: '#1B1B1B', lineHeight: 20 },
  highlight: { fontWeight: '700', color: '#1B4332' },
  bold: { fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancel: { backgroundColor: '#F4EAC8' },
  cancelText: { fontWeight: '600', color: '#5C5C5C' },
  confirm: { backgroundColor: '#2D6A4F' },
  confirmText: { fontWeight: '700', color: '#FEFAE0' },
});
