import { Stack } from "expo-router";

export default function BarberLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="planner" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="services" />
      <Stack.Screen name="create-entry" options={{ presentation: "modal" }} />
    </Stack>
  );
}
