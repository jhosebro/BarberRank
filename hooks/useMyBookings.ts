// hooks/useMyBookings.ts
// Carga las citas del cliente con actualización en tiempo real

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";
import { BookingStatus } from "./useBarberBookings";

export interface MyBooking {
  id: string;
  scheduled_at: string;
  ends_at: string;
  status: BookingStatus;
  total_price: number;
  notes: string | null;
  payment_status: string;
  service: { name: string; duration_min: number } | null;
  barber: {
    id: string;
    city: string;
    profile: { full_name: string; avatar_url: string | null };
  } | null;
}

export type BookingTab = "upcoming" | "history";

export function useMyBookings() {
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState<MyBooking[]>([]);
  const [history, setHistory] = useState<MyBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    const now = new Date().toISOString();

    // Próximas citas (pendientes o confirmadas, fecha futura)
    const { data: upcomingData } = await supabase
      .from("bookings")
      .select(
        `
        id, scheduled_at, ends_at, status, total_price, notes, payment_status,
        service:services(name, duration_min),
        barber:barbers(id, city, profile:profiles(full_name, avatar_url))
      `,
      )
      .eq("client_id", user.id)
      .in("status", ["pending", "confirmed"])
      .gte("scheduled_at", now)
      .order("scheduled_at", { ascending: true });

    // Historial (completadas, canceladas, pasadas)
    const { data: historyData } = await supabase
      .from("bookings")
      .select(
        `
        id, scheduled_at, ends_at, status, total_price, notes, payment_status,
        service:services(name, duration_min),
        barber:barbers(id, city, profile:profiles(full_name, avatar_url))
      `,
      )
      .eq("client_id", user.id)
      .or(`status.in.(completed,cancelled,no_show),scheduled_at.lt.${now}`)
      .order("scheduled_at", { ascending: false })
      .limit(20);

    setUpcoming((upcomingData as unknown as MyBooking[]) ?? []);
    setHistory((historyData as unknown as MyBooking[]) ?? []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchBookings();

    if (!user?.id) return;

    // Realtime: refresca si cambia alguna cita del cliente
    const channel = supabase
      .channel(`client-bookings-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `client_id=eq.${user.id}`,
        },
        () => fetchBookings(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBookings, user?.id]);

  const cancelBooking = async (bookingId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId)
      .eq("client_id", user?.id); // RLS extra por seguridad

    return !error;
  };

  return { upcoming, history, loading, cancelBooking, refetch: fetchBookings };
}
