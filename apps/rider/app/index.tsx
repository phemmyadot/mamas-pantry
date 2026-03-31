import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a472a' }}>
      <ActivityIndicator size="large" color="#fff" />
    </View>
  );
}
