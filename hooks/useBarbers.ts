// hooks/useBarbers.ts
// Hook para cargar y filtrar barberos desde Supabase

import { useCallback, useEffect, useState } from "react";
import { Barber } from "../lib/database.types";
import { supabase } from "../lib/supabase";

interface BarberWithServices extends Barber {
  services: { name: string; price: number }[];
  profile: { full_name: string; avatar_url: string | null };
}

interface UseBarbersOptions {
  city?: string;
  search?: string;
  maxPrice?: number | null;
  serviceFilter?: string | null;
}

export function useBarbers(options: UseBarbersOptions = {}) {
  const [barbers, setBarbers] = useState<BarberWithServices[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBarbers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("barbers")
        .select(
          `
          *,
          profile:profiles(full_name, avatar_url),
          services(name, price)
        `,
        )
        .eq("is_active", true)
        .order("rating", { ascending: false });

      if (options.city) {
        query = query.ilike("city", `%${options.city}%`);
      }

      if (options.maxPrice) {
        // Filtra barberos que tengan al menos un servicio <= maxPrice
        query = query.lte("services.price", options.maxPrice);
      }

      const { data, error: sbError } = await query;

      if (sbError) throw sbError;

      let result = (data as BarberWithServices[]) || [];

      // Filtro por nombre (client-side para mejor UX con debounce)
      if (options.search && options.search.trim()) {
        const term = options.search.toLowerCase();
        result = result.filter((b) =>
          b.profile?.full_name?.toLowerCase().includes(term),
        );
      }

      // Filtro por nombre de servicio
      if (options.serviceFilter) {
        const term = options.serviceFilter.toLowerCase();
        result = result.filter((b) =>
          b.services?.some((s) => s.name.toLowerCase().includes(term)),
        );
      }

      setBarbers(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [options.city, options.search, options.maxPrice, options.serviceFilter]);

  useEffect(() => {
    fetchBarbers();
  }, [fetchBarbers]);

  return { barbers, loading, error, refetch: fetchBarbers };
}
