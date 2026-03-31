import { Linking, Pressable, StyleSheet, Text } from 'react-native';
import { Card } from '@/atoms/Card';
import { SectionLabel } from '@/atoms/SectionLabel';

function openMaps(address: string) {
  const encoded = encodeURIComponent(address);
  const appleUrl = `maps:?q=${encoded}`;
  const googleUrl = `https://maps.google.com/?q=${encoded}`;
  Linking.canOpenURL(appleUrl).then((canOpen) => {
    Linking.openURL(canOpen ? appleUrl : googleUrl);
  });
}

interface AddressBlockProps {
  address: string;
}

export function AddressBlock({ address }: AddressBlockProps) {
  return (
    <Card>
      <SectionLabel>Delivery Address</SectionLabel>
      <Text style={styles.addressText}>{address}</Text>
      <Pressable style={styles.navigateButton} onPress={() => openMaps(address)}>
        <Text style={styles.navigateButtonText}>Navigate</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  addressText: { fontSize: 14, color: '#1B1B1B', lineHeight: 20 },
  navigateButton: {
    marginTop: 8,
    backgroundColor: '#1B4332',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  navigateButtonText: { color: '#FEFAE0', fontWeight: '600', fontSize: 14 },
});
