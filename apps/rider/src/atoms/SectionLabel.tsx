import { StyleSheet, Text } from 'react-native';

export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5C5C5C',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
});
