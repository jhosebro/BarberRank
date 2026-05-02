import { supabase } from "../lib/supabase";

export interface BarberUpdatePayload {
  city: string;
  country?: string;
  state?: string;
  address?: string | null;
  bio?: string | null;
}

export interface AvailabilitySlot {
  barber_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean | null;
}

export const barberService = {
  async updateBarber(profileId: string, data: BarberUpdatePayload) {
    if (!profileId) {
      throw new Error("profileId es requerido");
    }

    const { error } = await supabase
      .from("barbers")
      .update({
        city: data.city,
        country: data.country || null,
        state: data.state || null,
        address: data.address ?? null,
        bio: data.bio ?? null,
      })
      .eq("profile_id", profileId);

    if (error) {
      console.error("Error updateBarber:", error);
      throw new Error("No se pudo actualizar el perfil del barbero");
    }
  },

  async getBarberId(profileId: string): Promise<string> {
    if (!profileId) {
      throw new Error("profileId es requerido");
    }

    const { data, error } = await supabase
      .from("barbers")
      .select("id")
      .eq("profile_id", profileId)
      .single();

    if (error || !data) {
      console.error("Error getBarberId:", error);
      throw new Error("No se encontró el barbero");
    }

    return data.id;
  },

  async saveAvailability(barberId: string, slots: AvailabilitySlot[]) {
    if (!barberId) {
      throw new Error("barberId es requerido");
    }

    const { error: deleteError } = await supabase
      .from("availability")
      .delete()
      .eq("barber_id", barberId);

    if (deleteError) {
      console.error("Error deleting availability:", deleteError);
      throw new Error("No se pudo limpiar la disponibilidad");
    }

    if (!slots.length) return;

    const { error: insertError } = await supabase
      .from("availability")
      .insert(slots);

    if (insertError) {
      console.error("Error inserting availability:", insertError);
      throw new Error("No se pudo guardar la disponibilidad");
    }
  },

  async getAvailability(barberId: string): Promise<AvailabilitySlot[]> {
    if (!barberId) {
      throw new Error("barberId es requerido");
    }

    const { data, error } = await supabase
      .from("availability")
      .select("*")
      .eq("barber_id", barberId)
      .order("day_of_week", { ascending: true });

    if (error) {
      console.error("Error getAvailability:", error);
      throw new Error("No se pudo obtener la disponibilidad");
    }

    return data || [];
  },

  // 5. Obtener perfil completo (útil para dashboard)
  async getBarberProfile(profileId: string) {
    if (!profileId) {
      throw new Error("profileId es requerido");
    }

    const { data, error } = await supabase
      .from("barbers")
      .select("*")
      .eq("profile_id", profileId)
      .single();

    if (error || !data) {
      console.error("Error getBarberProfile:", error);
      throw new Error("No se pudo obtener el perfil del barbero");
    }

    return data;
  },

  // 6. Obtener ciudades con barberos activos
  async getCities(): Promise<string[]> {
    const { data, error } = await supabase
      .from("barbers")
      .select("city")
      .not("city", "is", null)
      .not("city", "eq", "");

    if (error) {
      console.error("Error getCities:", error);
      return [];
    }

    const uniqueCities = [...new Set(data.map((b) => b.city).filter(Boolean))];
    return uniqueCities.sort() as string[];
  },
};
