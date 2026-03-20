// hooks/usePushNotifications.ts
// Registra el token del dispositivo en Supabase y maneja notificaciones entrantes

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

// Cómo mostrar notificaciones con la app en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications() {
  const { user, isClient, isBarber } = useAuth();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    if (!user?.id) return;

    registerForPushNotifications();

    // Notificación recibida con app ABIERTA
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log(
          "Notificación recibida:",
          notification.request.content.title,
        );
      });

    // Usuario TOCA la notificación
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as {
          bookingId?: string;
          type?: string;
        };

        if (!data.bookingId) return;

        // Navega según rol
        if (isBarber) {
          router.push("/(barber)/planner");
        } else if (isClient) {
          router.push("/(client)/my-bookings");
        }
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user?.id, isClient, isBarber]);

  async function registerForPushNotifications() {
    if (!Device.isDevice) {
      console.log("Push notifications requieren dispositivo físico");
      return;
    }

    // Pedir permisos
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Permiso de notificaciones denegado");
      return;
    }

    // Canal Android
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "BarberApp",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#D4A853",
      });
    }

    // Obtener token de Expo Push
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });

    const pushToken = tokenData.data;

    // Guardar solo si cambió
    const { data: profile } = await supabase
      .from("profiles")
      .select("push_token")
      .eq("id", user!.id)
      .single();

    if (profile?.push_token !== pushToken) {
      await supabase
        .from("profiles")
        .update({ push_token: pushToken })
        .eq("id", user!.id);
    }
  }
}
