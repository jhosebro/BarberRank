// hooks/useBarberServices.ts
// CRUD completo de servicios del barbero

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

export interface BarberService {
  id: string;
  barber_id: string;
  name: string;
  description: string | null;
  duration_min: number;
  price: number;
  is_active: boolean;
}

export interface ServiceForm {
  name: string;
  description: string;
  duration_min: number;
  price: number;
}

const EMPTY_FORM: ServiceForm = {
  name: "",
  description: "",
  duration_min: 30,
  price: 0,
};

export function useBarberServices() {
  const { profile } = useAuth();
  const [services, setServices] = useState<BarberService[]>([]);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Obtener barberId a partir del profile
  useEffect(() => {
    if (!profile?.id) return;
    supabase
      .from("barbers")
      .select("id")
      .eq("profile_id", profile.id)
      .single()
      .then(({ data }) => setBarberId(data?.id ?? null));
  }, [profile?.id]);

  const fetchServices = useCallback(async () => {
    if (!barberId) return;
    setLoading(true);
    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("barber_id", barberId)
      .order("is_active", { ascending: false }) // activos primero
      .order("name", { ascending: true });
    setServices((data as BarberService[]) ?? []);
    setLoading(false);
  }, [barberId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // ── Crear servicio ──
  const createService = async (form: ServiceForm) => {
    if (!barberId) return { success: false, error: "Barbero no encontrado" };
    setSaving(true);
    const { error } = await supabase.from("services").insert({
      barber_id: barberId,
      name: form.name.trim(),
      description: form.description.trim() || null,
      duration_min: form.duration_min,
      price: form.price,
      is_active: true,
    });
    setSaving(false);
    if (error) return { success: false, error: error.message };
    await fetchServices();
    return { success: true };
  };

  // ── Editar servicio ──
  const updateService = async (id: string, form: ServiceForm) => {
    setSaving(true);
    const { error } = await supabase
      .from("services")
      .update({
        name: form.name.trim(),
        description: form.description.trim() || null,
        duration_min: form.duration_min,
        price: form.price,
      })
      .eq("id", id);
    setSaving(false);
    if (error) return { success: false, error: error.message };
    await fetchServices();
    return { success: true };
  };

  // ── Activar / desactivar ──
  const toggleService = async (id: string, isActive: boolean) => {
    // Optimista: actualiza UI de inmediato
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_active: isActive } : s)),
    );
    const { error } = await supabase
      .from("services")
      .update({ is_active: isActive })
      .eq("id", id);
    // Si falla, revierte
    if (error) {
      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: !isActive } : s)),
      );
      return { success: false };
    }
    return { success: true };
  };

  // ── Eliminar servicio ──
  const deleteService = async (id: string) => {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    setServices((prev) => prev.filter((s) => s.id !== id));
    return { success: true };
  };

  return {
    services,
    loading,
    saving,
    barberId,
    EMPTY_FORM,
    createService,
    updateService,
    toggleService,
    deleteService,
    refetch: fetchServices,
  };
}
