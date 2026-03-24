import { Stack, router, useSegments } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

export default function RootLayout() {
  //FIXME: Implementar correctamente las notificaciones push para citas y reseñas
  //usePushNotifications();
  const { session, loading, profile } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    if (session && !profile) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
      return;
    } else if (session && inAuthGroup) {
      if (profile?.role === "barber") {
        router.replace("/(barber)/planner");
      } else {
        router.replace("/(client)/discovery");
      }
    }
  }, [session, loading, profile, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(client)" />
      <Stack.Screen name="(barber)" />
    </Stack>
  );
}
