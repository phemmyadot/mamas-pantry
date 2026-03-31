import { StyleSheet, Text, View } from 'react-native';

export function StatusPill({ label }: { label: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

export function CountBadge({ count, suffix = '' }: { count: number; suffix?: string }) {
  return (
    <View style={styles.countBadge}>
      <Text style={styles.countText}>
        {count}{suffix}
      </Text>
    </View>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <View style={[styles.statusBadge, active ? styles.activeBadge : styles.inactiveBadge]}>
      <Text style={[styles.statusText, active ? styles.activeText : styles.inactiveText]}>
        {active ? 'Active' : 'Inactive'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: '#FEFAE0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 0.5,
    borderColor: '#F4EAC8',
  },
  pillText: { fontSize: 11, fontWeight: '600', color: '#7a5500' },
  countBadge: {
    backgroundColor: '#D4A017',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countText: { fontSize: 12, fontWeight: '600', color: '#7a5500' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  activeBadge: { backgroundColor: '#D8F3DC' },
  inactiveBadge: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: 13, fontWeight: '600' },
  activeText: { color: '#1B4332' },
  inactiveText: { color: '#C4622D' },
});
