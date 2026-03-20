// supabase/functions/send-reminder/index.ts
// Edge Function: envía recordatorios 24h y 1h antes de cada cita
// Llamada por pg_cron automáticamente

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

serve(async (req) => {
  try {
    const { type } = (await req.json()) as { type: "24h" | "1h" };

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = new Date();
    let from: Date, to: Date;

    if (type === "24h") {
      from = new Date(now.getTime() + 23 * 60 * 60 * 1000);
      to = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    } else {
      from = new Date(now.getTime() + 50 * 60 * 1000);
      to = new Date(now.getTime() + 70 * 60 * 1000);
    }

    // Citas confirmadas en la ventana de tiempo
    const { data: bookings } = await supabase
      .from("bookings")
      .select(
        `
        id, scheduled_at,
        service:services(name),
        barber:barbers(profile:profiles(full_name)),
        client:profiles!bookings_client_id_fkey(id, full_name, push_token)
      `,
      )
      .eq("status", "confirmed")
      .gte("scheduled_at", from.toISOString())
      .lte("scheduled_at", to.toISOString());

    if (!bookings?.length) {
      return new Response(
        JSON.stringify({ message: "No bookings to remind" }),
        { status: 200 },
      );
    }

    // Evitar duplicados: no enviar si ya se notificó en esta ventana
    const notifType = type === "24h" ? "reminder_24h" : "reminder_1h";

    const messages = [];
    const logs = [];

    for (const booking of bookings) {
      const token = booking.client?.push_token;
      if (!token) continue;

      // Verificar que no se haya enviado ya
      const { data: existing } = await supabase
        .from("notification_logs")
        .select("id")
        .eq("booking_id", booking.id)
        .eq("type", notifType)
        .single();

      if (existing) continue; // Ya enviado

      const date = new Date(booking.scheduled_at).toLocaleDateString("es-CO", {
        weekday: "long",
        day: "numeric",
        month: "short",
      });
      const time = new Date(booking.scheduled_at).toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const barberName = booking.barber?.profile?.full_name ?? "tu barbero";
      const serviceName = booking.service?.name ?? "tu cita";

      messages.push({
        to: token,
        title:
          type === "24h" ? "📅 Mañana tienes cita" : "⏰ Tu cita es en 1 hora",
        body:
          type === "24h"
            ? `Recuerda: ${serviceName} con ${barberName} el ${date} a las ${time}`
            : `En 1 hora tienes ${serviceName} con ${barberName} a las ${time}`,
        sound: "default",
        data: { bookingId: booking.id, type: notifType },
      });

      logs.push({
        user_id: booking.client.id,
        booking_id: booking.id,
        type: notifType,
        success: true,
      });
    }

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ message: "All reminders already sent" }),
        { status: 200 },
      );
    }

    // Enviar en batch a Expo (máximo 100 por request)
    const chunks = [];
    for (let i = 0; i < messages.length; i += 100) {
      chunks.push(messages.slice(i, i + 100));
    }

    for (const chunk of chunks) {
      await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(chunk),
      });
    }

    // Guardar logs
    await supabase.from("notification_logs").insert(logs);

    return new Response(
      JSON.stringify({ success: true, sent: messages.length }),
      { status: 200 },
    );
  } catch (err) {
    console.error("Reminder error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
    });
  }
});
