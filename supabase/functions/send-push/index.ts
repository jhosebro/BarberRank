// supabase/functions/send-push/index.ts
// Edge Function: envía notificaciones push via Expo Push API
// Deploy: npx supabase functions deploy send-push

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface PushPayload {
  bookingId: string;
  type:
    | "new_booking"
    | "booking_confirmed"
    | "booking_cancelled"
    | "booking_completed";
}

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: "default";
  badge?: number;
}

// Genera el contenido de la notificación según el tipo
function buildMessage(
  type: PushPayload["type"],
  booking: Record<string, unknown>,
): { title: string; body: string } {
  const barberName =
    (booking.barber as Record<string, unknown>)?.profile?.full_name ??
    "tu barbero";
  const clientName =
    (booking.client as Record<string, unknown>)?.full_name ?? "un cliente";
  const serviceName =
    (booking.service as Record<string, unknown>)?.name ?? "servicio";
  const date = new Date(booking.scheduled_at as string).toLocaleDateString(
    "es-CO",
    {
      weekday: "long",
      day: "numeric",
      month: "short",
    },
  );
  const time = new Date(booking.scheduled_at as string).toLocaleTimeString(
    "es-CO",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  const messages = {
    new_booking: {
      title: "📅 Nueva cita solicitada",
      body: `${clientName} quiere reservar ${serviceName} el ${date} a las ${time}`,
    },
    booking_confirmed: {
      title: "✅ Cita confirmada",
      body: `${barberName} confirmó tu cita para el ${date} a las ${time}`,
    },
    booking_cancelled: {
      title: "❌ Cita cancelada",
      body: `Tu cita del ${date} a las ${time} fue cancelada`,
    },
    booking_completed: {
      title: "⭐ ¿Cómo te fue?",
      body: `Califica tu experiencia con ${barberName}`,
    },
  };

  return messages[type];
}

serve(async (req) => {
  try {
    const { bookingId, type } = (await req.json()) as PushPayload;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Obtener la cita completa con tokens push
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(
        `
        *,
        service:services(name),
        barber:barbers(profile:profiles(full_name, push_token)),
        client:profiles!bookings_client_id_fkey(full_name, push_token)
      `,
      )
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
      });
    }

    const message = buildMessage(type, booking);

    // Determinar a quién notificar
    const recipients: { userId: string; token: string }[] = [];

    if (type === "new_booking") {
      // Notificar al barbero
      const token = booking.barber?.profile?.push_token;
      const barberId = booking.barber?.id;
      if (token && barberId) recipients.push({ userId: barberId, token });
    } else {
      // Notificar al cliente
      const token = booking.client?.push_token;
      const clientId = booking.client_id;
      if (token && clientId) recipients.push({ userId: clientId, token });
    }

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ message: "No push tokens found" }), {
        status: 200,
      });
    }

    // Enviar via Expo Push API
    const expoMessages: ExpoMessage[] = recipients.map((r) => ({
      to: r.token,
      title: message.title,
      body: message.body,
      sound: "default",
      data: { bookingId, type },
    }));

    const expoRes = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(expoMessages),
    });

    const expoData = await expoRes.json();

    // Registrar en notification_logs
    const logs = recipients.map((r) => ({
      user_id: r.userId,
      booking_id: bookingId,
      type,
      success: expoRes.ok,
      error: expoRes.ok ? null : JSON.stringify(expoData),
    }));

    await supabase.from("notification_logs").insert(logs);

    return new Response(JSON.stringify({ success: true, data: expoData }), {
      status: 200,
    });
  } catch (err) {
    console.error("Push error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
});
