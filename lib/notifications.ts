// lib/notifications.ts
// Utilidad para disparar notificaciones desde la app al cambiar estado de una cita

import { supabase } from "./supabase";

type NotificationType =
  | "new_booking"
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_completed";

/**
 * Llama a la Edge Function send-push para notificar al destinatario correcto.
 * Se invoca en los puntos clave del flujo:
 *   - Cliente crea cita       → type: "new_booking"       → notifica al barbero
 *   - Barbero acepta cita     → type: "booking_confirmed"  → notifica al cliente
 *   - Barbero/cliente cancela → type: "booking_cancelled"  → notifica al otro
 *   - Barbero marca completada→ type: "booking_completed"  → notifica al cliente (pide reseña)
 */
export async function notifyBookingChange(
  bookingId: string,
  type: NotificationType,
): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke("send-push", {
      body: { bookingId, type },
    });

    if (error) {
      console.warn("Error enviando notificación:", error.message);
    }
  } catch (err) {
    // Las notificaciones nunca deben romper el flujo principal
    console.warn("Fallo silencioso en notificación:", err);
  }
}
