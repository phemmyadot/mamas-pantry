import { Tabs } from "expo-router";
import DeliveryIcon from "../components/DeliveryIcon";
import ProfileIcon from "../components/ProfileIcon";

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#1B4332" },
        headerTintColor: "#FEFAE0",
        headerTitleStyle: { fontWeight: "700" },
        tabBarActiveTintColor: "#1B4332",
        tabBarInactiveTintColor: "#5C5C5C",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#F4EAC8",
          borderTopWidth: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="deliveries"
        options={{
          title: "Deliveries",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <DeliveryIcon
              color={focused ? "#1B4332" : "#5C5C5C"}
              size={22}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <ProfileIcon
              color={focused ? "#1B4332" : "#5C5C5C"}
              size={22}
            />
          ),
        }}
      />
    </Tabs>
  );
}
