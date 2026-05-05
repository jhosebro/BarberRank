import { supabase } from "../lib/supabase";

export interface BarberUpdatePayload {
  city: string;
  country?: string;
  state?: number;
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
    const barber = await this.getOrCreateBarberProfile(profileId);
    return barber.id;
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
  async getOrCreateBarberProfile(profileId: string) {
    if (!profileId) {
      throw new Error("profileId es requerido");
    }

    const { data, error } = await supabase
      .from("barbers")
      .select("*")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (error) {
      console.error("Error buscando barbero:", error);
      throw new Error("Error consultando el perfil");
    }

    if (data) return data;

    // 🔥 CREACIÓN AUTOMÁTICA
    const { data: newBarber, error: insertError } = await supabase
      .from("barbers")
      .insert({
        profile_id: profileId,
        city: "",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creando barbero:", insertError);
      throw new Error("No se pudo crear el perfil");
    }

    return newBarber;
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
