import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/atoms/Avatar';
import { Card } from '@/atoms/Card';
import { InfoRow } from '@/atoms/InfoRow';
import { OutlineButton } from '@/atoms/Button';
import { StatusBadge } from '@/atoms/Badge';
import { Text } from 'react-native';

export default function ProfileScreen() {
  const { rider, logout } = useAuth();

  function handleLogout() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);
  }

  if (!rider) return null;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.avatarSection}>
          <Avatar initial={(rider.username ?? rider.email).charAt(0)} />
          <Text style={styles.name}>{rider.username ?? rider.email}</Text>
          <StatusBadge active={rider.is_active} />
        </View>

        <Card>
          <InfoRow label="Email" value={rider.email} />
          <View style={styles.divider} />
          {rider.phone ? (
            <>
              <InfoRow label="Phone" value={rider.phone} />
              <View style={styles.divider} />
            </>
          ) : null}
          <InfoRow label="Rider ID" value={rider.id.slice(0, 8).toUpperCase()} mono />
        </Card>

        <OutlineButton label="Sign out" onPress={handleLogout} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FEFAE0' },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  name: { fontSize: 22, fontWeight: '700', color: '#1B1B1B' },
  divider: { height: 1, backgroundColor: '#F4EAC8', marginVertical: 8 },
});
