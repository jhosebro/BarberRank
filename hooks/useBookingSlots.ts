// hooks/useBookingSlots.ts
// Calcula los slots de tiempo disponibles para un barbero en una fecha específica

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export interface TimeSlot {
  time: string; // "09:00"
  label: string; // "9:00 am"
  available: boolean;
  datetime: Date;
}

function formatLabel(h: number, m: number): string {
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function useBookingSlots(
  barberId: string | null,
  date: Date | null,
  durationMin: number,
) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!barberId || !date) {
      setSlots([]);
      return;
    }

    async function fetchSlots() {
      setLoading(true);

      const dayOfWeek = date!.getDay(); // 0=Dom … 6=Sáb

      // 1. Obtener horario del barbero para ese día
      const { data: avail } = await supabase
        .from("availability")
        .select("start_time, end_time")
        .eq("barber_id", barberId)
        .eq("day_of_week", dayOfWeek)
        .eq("is_active", true)
        .single();

      if (!avail) {
        setSlots([]);
        setLoading(false);
        return;
      }

      // 2. Obtener citas ya reservadas ese día
      const dayStart = new Date(date!);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date!);
      dayEnd.setHours(23, 59, 59, 999);

      const { data: existing } = await supabase
        .from("bookings")
        .select("scheduled_at, ends_at")
        .eq("barber_id", barberId)
        .in("status", ["pending", "confirmed"])
        .gte("scheduled_at", dayStart.toISOString())
        .lte("scheduled_at", dayEnd.toISOString());

      // 3. Generar todos los slots posibles cada `durationMin` minutos
      const [startH, startM] = avail.start_time.split(":").map(Number);
      const [endH, endM] = avail.end_time.split(":").map(Number);
      const startTotal = startH * 60 + startM;
      const endTotal = endH * 60 + endM;

      const now = new Date();
      const isToday = date!.toDateString() === now.toDateString();

      const generated: TimeSlot[] = [];

      for (
        let min = startTotal;
        min + durationMin <= endTotal;
        min += durationMin
      ) {
        const h = Math.floor(min / 60);
        const m = min % 60;

        const slotDate = new Date(date!);
        slotDate.setHours(h, m, 0, 0);

        const slotEnd = new Date(slotDate.getTime() + durationMin * 60000);

        // Descartar slots pasados si es hoy
        if (isToday && slotDate <= now) continue;

        // Verificar si hay colisión con citas existentes
        const hasConflict = (existing ?? []).some((b) => {
          const bStart = new Date(b.scheduled_at);
          const bEnd = new Date(b.ends_at);
          return slotDate < bEnd && slotEnd > bStart;
        });

        const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

        generated.push({
          time: timeStr,
          label: formatLabel(h, m),
          available: !hasConflict,
          datetime: slotDate,
        });
      }

      setSlots(generated);
      setLoading(false);
    }

    fetchSlots();
  }, [barberId, date?.toDateString(), durationMin]);

  return { slots, loading };
}
