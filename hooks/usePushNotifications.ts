// hooks/usePushNotifications.ts
// Registra el token del dispositivo en Supabase y maneja notificaciones entrantes

import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

// Cómo mostrar notificaciones con la app en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const { user, isClient, isBarber } = useAuth();
  const notificationListener = useRef<Notifications.Subscription | undefined>(
    undefined,
  );
  const responseListener = useRef<Notifications.Subscription | undefined>(
    undefined,
  );
  const isExpoGo = Constants.executionEnvironment === "storeClient";
  const registerForPushNotifications = useCallback(async () => {
    if (Constants.executionEnvironment === "storeClient") {
      console.log("Push notifications no disponibles en Expo Go");
      return null;
    }
    if (!Device.isDevice) {
      console.log("Push notifications requieren dispositivo físico");
      return;
    }

    try {
      // 1. Pedir permisos
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

      // 2. Configurar Canal Android (Obligatorio)
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "BarberApp",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#D4A853",
        });
      }

      // 3. Obtener el Token con manejo de errores
      // Si estás en Expo Go sin Firebase, esto saltará al catch
      const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;

      if (!projectId) {
        console.warn("Falta EXPO_PUBLIC_PROJECT_ID en el .env");
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      const pushToken = tokenData.data;

      // 4. Guardar en Supabase (Solo si tenemos el token)
      if (pushToken && user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("push_token")
          .eq("id", user.id)
          .single();

        if (profile?.push_token !== pushToken) {
          await supabase
            .from("profiles")
            .update({ push_token: pushToken })
            .eq("id", user.id);
        }
      }
    } catch (error) {
      console.error("Error en el registro de notificaciones:", error);
      // Aquí es donde capturamos el error de Firebase para que la app NO se cierre
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    if (isExpoGo) {
      console.log("Modo Expo Go: push desactivadas");
      return;
    }

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
  }, [user?.id, isClient, isBarber, registerForPushNotifications]);
}
