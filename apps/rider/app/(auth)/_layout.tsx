import { Stack, Redirect } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthLayout() {
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  if (isLoading) return null;

  if (isAuthenticated) return <Redirect href="/(app)/deliveries" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
