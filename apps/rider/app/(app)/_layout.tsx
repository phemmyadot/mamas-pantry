import { Tabs } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={[styles.icon, focused && styles.iconFocused]}>
      {label === "Deliveries" ? "📦" : "👤"}
    </Text>
  );
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#1a472a" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700" },
        tabBarActiveTintColor: "#1a472a",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: { borderTopColor: "#e5e7eb" },
      }}
    >
      <Tabs.Screen
        name="deliveries"
        options={{
          title: "Deliveries",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Deliveries" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: { fontSize: 22, opacity: 0.5 },
  iconFocused: { opacity: 1 },
});
