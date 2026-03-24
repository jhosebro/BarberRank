// app/(client)/_layout.tsx
import { Stack } from "expo-router";

export default function ClientLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="discovery" />
      <Stack.Screen name="barber-profile" options={{ presentation: "card" }} />
      <Stack.Screen name="booking" options={{ presentation: "modal" }} />
      <Stack.Screen
        name="booking-success"
        options={{ presentation: "modal" }}
      />
      <Stack.Screen name="my-bookings" options={{ presentation: "modal" }} />
      <Stack.Screen name="review" options={{ presentation: "modal" }} />
      <Stack.Screen name="review-success" options={{ presentation: "modal" }} />
    </Stack>
  );
}
