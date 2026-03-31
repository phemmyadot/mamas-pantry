import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Slot,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 0, staleTime: 30_000 },
  },
});

function NavigationGuard() {
  const { isLoading, isAuthenticated } = useAuth();

  const segments = useSegments();
  const router = useRouter();
  const navState = useRootNavigationState();

  useEffect(() => {
    if (!navState?.key || isLoading) return; // wait until router and auth are ready

    SplashScreen.hideAsync();

    const inAuthGroup = segments?.[0] === "(auth)";
    const inAppGroup = segments?.[0] === "(app)";
    const isAtRoot = segments?.[0] === undefined;

    console.log(
      "Rider app loaded",
      { inAuthGroup, inAppGroup, isAtRoot },
      isAuthenticated,
      "seg:",
      segments,
    );

    if (!isAuthenticated && !inAuthGroup) {
      // Unauthenticated users should be in auth flow
      router.replace("/(auth)/login");
      return;
    }

    if (isAuthenticated && (inAuthGroup || isAtRoot)) {
      // Authenticated users should land in app flow
      router.replace("/(app)/deliveries");
      return;
    }

    // no-op if already on an allowed route (e.g. /app/* for authenticated users,
    // /auth/* for unauthenticated users)
  }, [navState?.key, isLoading, isAuthenticated, segments]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NavigationGuard />
      </AuthProvider>
    </QueryClientProvider>
  );
}
