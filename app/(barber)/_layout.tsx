import { Stack } from "expo-router";

export default function BarberLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="planner" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
