interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
}
export type WeekSchedule = Record<number, DaySchedule>;
