// lib/supabase.ts
// Cliente de Supabase para toda la app

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage, // Persiste la sesión en el dispositivo
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // En RN no hay URL, esto va false
  },
});
