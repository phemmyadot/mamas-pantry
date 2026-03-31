import { Tabs, Redirect } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import DeliveryIcon from "../components/DeliveryIcon";
import ProfileIcon from "../components/ProfileIcon";

export default function AppLayout() {
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  if (isLoading) return null;

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

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
