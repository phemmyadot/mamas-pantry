import { StyleSheet, View, ViewProps } from 'react-native';

export function Card({ style, children, ...props }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 6,
    borderWidth: 0.5,
    borderColor: '#F4EAC8',
  },
});
