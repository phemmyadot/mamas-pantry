import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

interface ButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function PrimaryButton({ label, onPress, loading, disabled, style }: ButtonProps) {
  return (
    <Pressable
      style={[styles.primary, (loading || disabled) && styles.disabled, style]}
      onPress={onPress}
      disabled={loading || disabled}
    >
      {loading ? (
        <ActivityIndicator color="#FEFAE0" />
      ) : (
        <Text style={styles.primaryText}>{label}</Text>
      )}
    </Pressable>
  );
}

export function OutlineButton({ label, onPress, style }: Omit<ButtonProps, 'loading' | 'disabled'>) {
  return (
    <Pressable style={[styles.outline, style]} onPress={onPress}>
      <Text style={styles.outlineText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    backgroundColor: '#1B4332',
    borderRadius: 10,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryText: { color: '#FEFAE0', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.6 },
  outline: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C4622D',
  },
  outlineText: { color: '#C4622D', fontSize: 15, fontWeight: '600' },
});
