import { StyleSheet, Text, View } from 'react-native';

export function Avatar({ initial }: { initial: string }) {
  return (
    <View style={styles.avatar}>
      <Text style={styles.text}>{initial.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  text: { fontSize: 34, fontWeight: '700', color: '#FEFAE0' },
});
