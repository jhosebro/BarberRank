import { WeekSchedule } from "@/types/onboarding.types";

export const mapScheduleToSlots = (
  schedule: WeekSchedule,
  barberId: string,
) => {
  return Object.entries(schedule)
    .filter(([, slot]) => slot.enabled)
    .map(([dayStr, slot]) => ({
      barber_id: barberId,
      day_of_week: parseInt(dayStr),
      start_time: slot.start,
      end_time: slot.end,
      is_active: true,
    }));
};
