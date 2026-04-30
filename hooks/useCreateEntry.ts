// hooks/useCreateEntry.ts
// Lógica de negocio para que el barbero cree entradas en su agenda.
// Sigue Clean Architecture: toda la lógica aquí, la UI solo consume.

import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { Database } from "../lib/database.types";
import { supabase } from "../lib/supabase";

// ─── Tipos ────────────────────────────────────────────────
export type EntryType = "barber_booking" | "external_booking" | "block";

export type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];

export interface ServiceOption {
  id: string;
  name: string;
  duration_min: number;
  price: number;
}

export interface ClientOption {
  id: string;
  full_name: string;
  phone: string | null;
}

export interface CreateEntryState {
  entryType: EntryType;
  selectedDate: Date;
  selectedTime: string; // "HH:MM"
  selectedService: ServiceOption | null;
  selectedClient: ClientOption | null;
  externalName: string;
  externalPhone: string;
  blockReason: string;
  clientSearch: string;
}

// ─── Helpers internos ─────────────────────────────────────
function buildScheduledAt(date: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const dt = new Date(date);
  dt.setHours(h, m, 0, 0);
  return dt;
}

function buildEndsAt(scheduledAt: Date, durationMin: number): Date {
  return new Date(scheduledAt.getTime() + durationMin * 60_000);
}

function fmtTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

// ─── Hook principal ───────────────────────────────────────
export function useCreateEntry(
  barberId: string | null,
  services: ServiceOption[],
  initialDate: Date,
) {
  // ── Estado ──
  const [entryType, setEntryType] = useState<EntryType>("external_booking");
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(
    services.length > 0 ? services[0] : null,
  );
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(
    null,
  );
  const [externalName, setExternalName] = useState("");
  const [externalPhone, setExternalPhone] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [clientResults, setClientResults] = useState<ClientOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Validación centralizada en el hook ────────────────────
  // ✅ Mejora: canSave es una propiedad derivada, la UI no necesita conocer las reglas
  const canSave = useMemo(() => {
    if (!selectedTime) return false;
    if (entryType === "barber_booking")
      return !!selectedClient && !!selectedService;
    if (entryType === "external_booking")
      return externalName.trim().length >= 2 && !!selectedService;
    if (entryType === "block") return blockReason.trim().length >= 2;
    return false;
  }, [
    entryType,
    selectedTime,
    selectedClient,
    selectedService,
    externalName,
    blockReason,
  ]);

  // ── Resumen legible para la UI ─────────────────────────────
  // ✅ Mejora: la UI no transforma datos, solo muestra lo que el hook prepara
  const summary = useMemo(() => {
    const dateStr = selectedDate.toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const timeStr = selectedTime ? fmtTime(selectedTime) : "—";

    if (entryType === "block") {
      return {
        title: blockReason || "Bloqueo de tiempo",
        subtitle: `${dateStr} · ${timeStr}`,
        price: null,
      };
    }

    const clientName =
      entryType === "barber_booking"
        ? (selectedClient?.full_name ?? "—")
        : externalName || "—";

    return {
      title: selectedService?.name ?? "—",
      subtitle: `${clientName} · ${dateStr} · ${timeStr}`,
      price: selectedService?.price ?? null,
    };
  }, [
    entryType,
    selectedDate,
    selectedTime,
    selectedService,
    selectedClient,
    externalName,
    blockReason,
  ]);

  // ── Búsqueda de clientes registrados ──────────────────────
  const searchClients = useCallback(async (query: string) => {
    setClientSearch(query);
    if (query.trim().length < 2) {
      setClientResults([]);
      return;
    }
    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, phone")
      .eq("role", "client")
      .ilike("full_name", `%${query}%`)
      .limit(8);
    setClientResults((data as ClientOption[]) ?? []);
    setSearching(false);
  }, []);

  const selectClient = useCallback((client: ClientOption) => {
    setSelectedClient(client);
    setClientSearch(client.full_name);
    setClientResults([]);
  }, []);

  // ── Generación de slots de tiempo ─────────────────────────
  // ✅ Mejora: lógica de slots completamente en el hook, la UI solo renderiza el array
  const generateTimeSlots = useCallback(async (): Promise<
    { time: string; label: string; available: boolean }[]
  > => {
    if (!barberId) return [];

    const dayOfWeek = selectedDate.getDay();
    const { data: avail } = await supabase
      .from("availability")
      .select("start_time, end_time")
      .eq("barber_id", barberId)
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true)
      .single();

    if (!avail) return [];

    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    const { data: existing } = await supabase
      .from("bookings")
      .select("scheduled_at, ends_at")
      .eq("barber_id", barberId)
      .in("status", ["pending", "confirmed"])
      .gte("scheduled_at", dayStart.toISOString())
      .lte("scheduled_at", dayEnd.toISOString());

    const [sh, sm] = avail.start_time.split(":").map(Number);
    const [eh, em] = avail.end_time.split(":").map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    const step = selectedService?.duration_min ?? 30;
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    const slots: { time: string; label: string; available: boolean }[] = [];

    for (let min = start; min + step <= end; min += step) {
      const h = Math.floor(min / 60);
      const m = min % 60;
      const dt = new Date(selectedDate);
      dt.setHours(h, m, 0, 0);
      if (isToday && dt <= now) continue;

      const slotEnd = new Date(dt.getTime() + step * 60_000);
      const busy = (existing ?? []).some((b) => {
        const bs = new Date(b.scheduled_at);
        const be = new Date(b.ends_at);
        return dt < be && slotEnd > bs;
      });

      const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      slots.push({ time: timeStr, label: fmtTime(timeStr), available: !busy });
    }

    return slots;
  }, [barberId, selectedDate, selectedService?.duration_min]);

  // ── Guardar entrada ────────────────────────────────────────
  // ✅ Mejora: toda la lógica de persistencia y navegación centralizada aquí
  const handleSave = useCallback(async () => {
    if (!barberId || !canSave) return;
    setSaving(true);

    try {
      const scheduledAt = buildScheduledAt(selectedDate, selectedTime);
      const duration =
        entryType === "block" ? 60 : (selectedService?.duration_min ?? 30);
      const endsAt = buildEndsAt(scheduledAt, duration);

      const payload: BookingInsert = {
        barber_id: barberId,
        scheduled_at: scheduledAt.toISOString(),
        ends_at: endsAt.toISOString(),
        status: "confirmed", // el barbero crea directamente confirmada
        entry_type: entryType,
        total_price: selectedService?.price ?? 0,
      };

      if (entryType === "barber_booking") {
        payload.client_id = selectedClient!.id;
        payload.service_id = selectedService!.id;
      } else if (entryType === "external_booking") {
        payload.service_id = selectedService!.id;
        payload.external_client_name = externalName.trim();
        payload.external_client_phone = externalPhone.trim() || null;
      } else if (entryType === "block") {
        payload.block_reason = blockReason.trim();
        payload.total_price = 0;
      }

      const { data: user } = await supabase.auth.getUser();

      console.log("auth.uid()", user.user?.id);
      console.log("barberId", barberId);
      const { error } = await supabase.from("bookings").insert(payload);
      if (error) throw error;

      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "No se pudo crear la entrada.");
    } finally {
      setSaving(false);
    }
  }, [
    barberId,
    canSave,
    entryType,
    selectedDate,
    selectedTime,
    selectedService,
    selectedClient,
    externalName,
    externalPhone,
    blockReason,
  ]);

  // ── handleCancel con confirmación ──────────────────────────
  const handleCancel = useCallback(() => {
    const hasData =
      selectedTime || externalName || selectedClient || blockReason;
    if (!hasData) {
      router.back();
      return;
    }

    Alert.alert("¿Descartar cambios?", "Perderás la información ingresada.", [
      { text: "Seguir editando", style: "cancel" },
      { text: "Descartar", style: "destructive", onPress: () => router.back() },
    ]);
  }, [selectedTime, externalName, selectedClient, blockReason]);

  return {
    // Estado
    entryType,
    setEntryType,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    selectedService,
    setSelectedService,
    externalName,
    setExternalName,
    externalPhone,
    setExternalPhone,
    blockReason,
    setBlockReason,
    clientSearch,
    clientResults,
    searching,
    saving,
    // Derivados
    canSave,
    summary,
    // Acciones
    searchClients,
    selectClient,
    generateTimeSlots,
    handleSave,
    handleCancel,
  };
}
