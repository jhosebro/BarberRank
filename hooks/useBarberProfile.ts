// hooks/useBarberProfile.ts
// Hook para cargar el perfil completo de un barbero: servicios, reseñas y disponibilidad

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export interface BarberService {
  id: string;
  name: string;
  description: string | null;
  duration_min: number;
  price: number;
}

export interface BarberReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  client: { full_name: string; avatar_url: string | null } | null;
}

export interface BarberAvailability {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface BarberProfile {
  id: string;
  bio: string | null;
  city: string;
  address: string | null;
  rating: number;
  review_count: number;
  profile: { full_name: string; avatar_url: string | null };
  services: BarberService[];
  reviews: BarberReview[];
  availability: BarberAvailability[];
}

export function useBarberProfile(barberId: string | null) {
  const [barber, setBarber] = useState<BarberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!barberId) return;

    async function fetch() {
      setLoading(true);
      setError(null);

      const { data, error: sbError } = await supabase
        .from("barbers")
        .select(
          `
          id, bio, city, address, rating, review_count,
          profile:profiles(full_name, avatar_url),
          services(id, name, description, duration_min, price),
          reviews(
            id, rating, comment, created_at,
            client:profiles(full_name, avatar_url)
          ),
          availability(day_of_week, start_time, end_time)
        `,
        )
        .eq("id", barberId)
        .eq("services.is_active", true)
        .order("created_at", { referencedTable: "reviews", ascending: false })
        .single();

      if (sbError) {
        setError(sbError.message);
      } else {
        setBarber(data as unknown as BarberProfile);
      }
      setLoading(false);
    }

    fetch();
  }, [barberId]);

  return { barber, loading, error };
}
