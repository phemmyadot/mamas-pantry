import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

interface SuccessModalProps {
  visible: boolean;
  orderId: string;
  onDismiss: () => void;
}

export function SuccessModal({ visible, orderId, onDismiss }: SuccessModalProps) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.icon}>✓</Text>
          <Text style={styles.title}>Delivered!</Text>
          <Text style={styles.body}>
            Order <Text style={styles.bold}>#{orderId}</Text> has been marked as delivered.
          </Text>
          <Pressable style={styles.button} onPress={onDismiss}>
            <Text style={styles.buttonText}>Done</Text>
          </Pressable>
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
    alignItems: 'center',
    gap: 12,
    borderWidth: 0.5,
    borderColor: '#F4EAC8',
  },
  icon: {
    fontSize: 40,
    color: '#1B4332',
    fontWeight: '700',
    backgroundColor: '#D8F3DC',
    width: 72,
    height: 72,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 72,
    borderRadius: 36,
    overflow: 'hidden',
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1B1B1B' },
  body: { fontSize: 14, color: '#5C5C5C', textAlign: 'center', lineHeight: 20 },
  bold: { fontWeight: '700', color: '#1B1B1B' },
  button: {
    marginTop: 4,
    backgroundColor: '#1B4332',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  buttonText: { color: '#FEFAE0', fontWeight: '700', fontSize: 15 },
});
