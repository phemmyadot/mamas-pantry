import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';

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
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(rider.username ?? rider.email).charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{rider.username ?? rider.email}</Text>
          <View style={[styles.statusBadge, rider.is_active ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={[styles.statusText, rider.is_active ? styles.activeText : styles.inactiveText]}>
              {rider.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.card}>
          <InfoRow label="Email" value={rider.email} />
          {rider.phone ? (
            <>
              <View style={styles.divider} />
              <InfoRow label="Phone" value={rider.phone} />
            </>
          ) : null}
          <View style={styles.divider} />
          <InfoRow label="Rider ID" value={rider.id.slice(0, 8).toUpperCase()} mono />
        </View>

        {/* Sign out */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, mono && styles.mono]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FEFAE0' },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1B4332',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D4A017',
  },
  avatarText: { fontSize: 34, fontWeight: '700', color: '#FEFAE0' },
  name: { fontSize: 22, fontWeight: '700', color: '#1B1B1B' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  activeBadge: { backgroundColor: '#D8F3DC' },
  inactiveBadge: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 13, fontWeight: '600' },
  activeText: { color: '#1B4332' },
  inactiveText: { color: '#C4622D' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#F4EAC8',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: { fontSize: 14, color: '#5C5C5C' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1B1B1B' },
  mono: { fontFamily: 'monospace' },
  divider: { height: 1, backgroundColor: '#F4EAC8', marginVertical: 8 },
  logoutButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C4622D',
  },
  logoutText: { color: '#C4622D', fontSize: 15, fontWeight: '600' },
});
