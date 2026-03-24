// hooks/useReviews.ts
// Hook para crear y consultar reseñas

import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

export interface ReviewPayload {
  bookingId: string;
  barberId: string;
  rating: number;
  comment: string;
}

export interface BarberReviewSummary {
  rating: number;
  review_count: number;
  breakdown: Record<number, number>; // { 5: 12, 4: 8, 3: 2, 2: 1, 1: 0 }
}

export function useReviews() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  // Verificar si el cliente ya dejó reseña para una cita
  const hasReviewed = async (bookingId: string): Promise<boolean> => {
    const { data } = await supabase
      .from("reviews")
      .select("id")
      .eq("booking_id", bookingId)
      .single();
    return !!data;
  };

  // Verificar si la cita está completada y sin reseña (puede dejar reseña)
  const canReview = async (bookingId: string): Promise<boolean> => {
    const { data: booking } = await supabase
      .from("bookings")
      .select("status, client_id")
      .eq("id", bookingId)
      .single();

    if (!booking || booking.status !== "completed") return false;
    if (booking.client_id !== user?.id) return false;

    return !(await hasReviewed(bookingId));
  };

  // Enviar reseña
  const submitReview = async (payload: ReviewPayload) => {
    if (!user?.id) return { success: false, error: "No autenticado" };
    setSubmitting(true);

    try {
      const { error } = await supabase.from("reviews").insert({
        booking_id: payload.bookingId,
        barber_id: payload.barberId,
        client_id: user.id,
        rating: payload.rating,
        comment: payload.comment.trim() || null,
      });

      if (error) throw error;

      // El trigger en Supabase actualiza automáticamente
      // el rating y review_count del barbero
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setSubmitting(false);
    }
  };

  // Resumen de ratings de un barbero
  const getBarberSummary = async (
    barberId: string,
  ): Promise<BarberReviewSummary | null> => {
    const { data: reviews } = await supabase
      .from("reviews")
      .select("rating")
      .eq("barber_id", barberId);

    if (!reviews?.length) return null;

    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      breakdown[r.rating as keyof typeof breakdown]++;
    });

    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

    return {
      rating: Math.round(avg * 10) / 10,
      review_count: reviews.length,
      breakdown,
    };
  };

  return { submitting, canReview, submitReview, getBarberSummary };
}
