// hooks/useBarberBookings.ts
import { notifyBookingChange } from "@/lib/notifications";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export interface BarberBooking {
  id: string;
  scheduled_at: string;
  ends_at: string;
  status: BookingStatus;
  total_price: number;
  notes: string | null;

  entry_type: string;

  external_client_name: string | null;
  external_client_phone: string | null;

  service: { name: string; duration_min: number } | null;

  client: {
    full_name: string;
    phone: string | null;
    avatar_url: string | null;
  } | null;
}

export function useBarberBookings(date: Date) {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<BarberBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [barberId, setBarberId] = useState<string | null>(null);

  // Refs para que el callback de Realtime siempre use valores frescos
  const barberIdRef = useRef<string | null>(null);
  const dateRef = useRef<Date>(date);
  useEffect(() => {
    dateRef.current = date;
  }, [date]);

  // 1. Resolver barberId desde el profile
  useEffect(() => {
    if (!profile?.id) return;
    supabase
      .from("barbers")
      .select("id")
      .eq("profile_id", profile.id)
      .single()
      .then(({ data }) => {
        const id = data?.id ?? null;
        setBarberId(id);
        barberIdRef.current = id;
      });
  }, [profile?.id]);

  // 2. Función de fetch estable
  const fetchBookings = useCallback(
    async (forBarberId: string, forDate: Date) => {
      const dayStart = new Date(forDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(forDate);
      dayEnd.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
    id, scheduled_at, ends_at, status, total_price, notes,
    entry_type, external_client_name, external_client_phone, block_reason,
    service:services(name, duration_min),
    client:profiles(full_name, phone, avatar_url)
  `,
        )
        .eq("barber_id", forBarberId)
        .gte("scheduled_at", dayStart.toISOString())
        .lte("scheduled_at", dayEnd.toISOString())
        .order("scheduled_at", { ascending: true });

      if (!error) {
        const mapped = (data ?? []).map((b: any): BarberBooking => {
          let displayName = "Cliente";
          let phone = null;

          if (b.entry_type === "barber_booking") {
            displayName = b.client?.full_name ?? "Cliente";
            phone = b.client?.phone ?? null;
          }

          if (b.entry_type === "external_booking") {
            displayName = b.external_client_name ?? "Cliente externo";
            phone = b.external_client_phone ?? null;
          }

          if (b.entry_type === "block") {
            displayName = b.block_reason ?? "Bloqueo";
          }

          return {
            ...b,
            client: {
              full_name: displayName,
              phone,
              avatar_url: b.client?.avatar_url ?? null,
            },
          };
        });

        setBookings(mapped);
      }
      setLoading(false);
    },
    [],
  );

  // 3. Cargar cuando cambia barberId o date
  useEffect(() => {
    if (!barberId) return;
    setLoading(true);
    fetchBookings(barberId, date);
  }, [barberId, date.toDateString(), fetchBookings]);

  // 4. Realtime — actualización quirúrgica en UPDATE, re-fetch en INSERT/DELETE
  useEffect(() => {
    if (!barberId) return;

    const channel = supabase
      .channel(`planner-${barberId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `barber_id=eq.${barberId}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setBookings((prev) =>
              prev.map((b) =>
                b.id === payload.new.id
                  ? { ...b, status: payload.new.status as BookingStatus }
                  : b,
              ),
            );
            return;
          }
          if (barberIdRef.current && dateRef.current) {
            fetchBookings(barberIdRef.current, dateRef.current);
          }
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn(
            "[Realtime] Error — verifica Database > Replication en Supabase",
          );
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [barberId, fetchBookings]);

  // 5. updateStatus con optimistic update
  const updateStatus = async (
    bookingId: string,
    status: BookingStatus,
  ): Promise<boolean> => {
    // Actualiza la UI antes de esperar la respuesta del servidor
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status } : b)),
    );

    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", bookingId);

    if (!error) {
      if (status === "confirmed")
        await notifyBookingChange(bookingId, "booking_confirmed");
      if (status === "cancelled")
        await notifyBookingChange(bookingId, "booking_cancelled");
      if (status === "completed")
        await notifyBookingChange(bookingId, "booking_completed");
    }
    return !error;
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    revenue: bookings
      .filter((b) => b.status === "completed")
      .reduce((sum, b) => sum + b.total_price, 0),
  };

  return { bookings, loading, barberId, stats, updateStatus };
}
