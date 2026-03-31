import { Stack } from "expo-router";

export default function DeliveriesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#1a472a" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[orderId]" options={{ headerShown: false }} />
    </Stack>
  );
}
