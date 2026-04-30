import { BarberBooking } from "@/hooks/useBarberBookings";

export function getClientDisplay(booking: BarberBooking) {
  if (booking.entry_type === "external_booking") {
    return {
      name: booking.external_client_name ?? "Cliente",
      phone: booking.external_client_phone ?? null,
      avatar_url: null,
    };
  }

  return {
    name: booking.client?.full_name ?? "Cliente",
    phone: booking.client?.phone ?? null,
    avatar_url: booking.client?.avatar_url ?? null,
  };
}
