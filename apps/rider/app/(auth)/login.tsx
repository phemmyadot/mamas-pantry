import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { PrimaryButton } from '@/atoms/Button';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(trimmedEmail, password);
    } catch (err: any) {
      Alert.alert(
        'Login failed',
        err?.message ?? err?.response?.data?.detail ?? 'Invalid email or password.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.logo}>Mama's Pantry</Text>
        <View style={styles.divider} />
        <Text style={styles.tagline}>Rider Portal</Text>
      </View>

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          keyboardType="email-address"
          returnKeyType="next"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={handleLogin}
          value={password}
          onChangeText={setPassword}
          editable={!loading}
        />
        <PrimaryButton label="Sign in" onPress={handleLogin} loading={loading} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B4332',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: { alignItems: 'center', marginBottom: 28, gap: 8 },
  logo: { fontSize: 30, fontWeight: '800', color: '#FEFAE0', letterSpacing: -0.5 },
  divider: { width: 36, height: 1.5, backgroundColor: '#D4A017', opacity: 0.8 },
  tagline: {
    fontSize: 12,
    color: '#B7E4C7',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FEFAE0',
    borderRadius: 16,
    padding: 24,
    gap: 12,
    borderWidth: 0.5,
    borderColor: '#F4EAC8',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#F4EAC8',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1B1B1B',
    backgroundColor: '#fff',
  },
});
