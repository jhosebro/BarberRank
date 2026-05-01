//TODO: Implementar ingreso con google

import { Profile, UserRole } from "@/lib/types";
import { Session, User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role?: UserRole;
}

interface SignInParams {
  email: string;
  password: string;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    loading: true,
  });

  // Carga el perfil del usuario desde la tabla profiles
  const fetchProfile = useCallback(
    async (userId: string, retries = 3): Promise<Profile | null> => {
      for (let i = 0; i < retries; i++) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();
        if (error) {
          console.log("Error fetching profile:", error);
        }
        if (data) return data as Profile;

        if (i < retries - 1) await new Promise((r) => setTimeout(r, 500));
      }
      return null;
    },
    [],
  );

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const profile = session?.user
        ? await fetchProfile(session.user.id)
        : null;
      setState({
        session,
        user: session?.user ?? null,
        profile,
        loading: false,
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const profile = session?.user
        ? await fetchProfile(session.user.id)
        : null;
      setState({
        session,
        user: session?.user ?? null,
        profile,
        loading: false,
      });
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // ── REGISTRO ──────────────────────────────────────────────
  const signUp = async ({
    email,
    password,
    fullName,
    phone,
    role = "client",
  }: SignUpParams) => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            role,
          },
        },
      });

      if (error) throw error;

      // El trigger handle_new_user() en Supabase crea el profile automáticamente.
      // Si el rol es barbero, también creamos el registro en barbers.
      if (data.user && role === "barber") {
        await supabase.from("barbers").insert({
          profile_id: data.user.id,
          city: "", // El barbero completará esto en su onboarding
        });
      }

      return { success: true, user: data.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setState((s) => ({ ...s, loading: false }));
    }
  };

  // ── LOGIN ─────────────────────────────────────────────────
  const signIn = async ({ email, password }: SignInParams) => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { success: true, user: data.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setState((s) => ({ ...s, loading: false }));
    }
  };

  // ── LOGIN CON GOOGLE (opcional) ───────────────────────────
  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });
    if (error) {
      console.log("Error logging with Google");
    }

    return data;
  };

  // ── LOGOUT ────────────────────────────────────────────────
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // ── ACTUALIZAR PERFIL ─────────────────────────────────────
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!state.user) return { success: false };

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", state.user.id)
      .select()
      .single();

    if (error) {
      return { success: false };
    }

    setState((s) => ({ ...s, profile: data as Profile }));
    return { success: true };
  };

  return {
    ...state,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    isAuthenticated: !!state.session,
    isBarber: state.profile?.role === "barber",
    isClient: state.profile?.role === "client",
  };
}
