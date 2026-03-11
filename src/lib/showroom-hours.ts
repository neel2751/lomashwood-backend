import type { ShowroomOpeningHour } from "@/types/showroom.types";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function normalizeDayKey(day: string): string {
  return day.trim().slice(0, 3).toLowerCase();
}

function getDayIndex(day: string): number {
  const key = normalizeDayKey(day);
  return DAY_KEYS.indexOf(key as (typeof DAY_KEYS)[number]);
}

export function getTodayHours(openingHours: ShowroomOpeningHour[]): string | undefined {
  const todayIndex = new Date().getDay();
  const todayKey = DAY_KEYS[todayIndex];
  const today = openingHours.find((hour) => normalizeDayKey(hour.day) === todayKey);
  return today?.hours;
}

export function sortOpeningHoursFromToday(openingHours: ShowroomOpeningHour[]): ShowroomOpeningHour[] {
  const todayIndex = new Date().getDay();

  return [...openingHours].sort((a, b) => {
    const aIndex = getDayIndex(a.day);
    const bIndex = getDayIndex(b.day);

    if (aIndex === -1 && bIndex === -1) {
      return a.day.localeCompare(b.day);
    }
    if (aIndex === -1) {
      return 1;
    }
    if (bIndex === -1) {
      return -1;
    }

    const aOffset = (aIndex - todayIndex + 7) % 7;
    const bOffset = (bIndex - todayIndex + 7) % 7;
    return aOffset - bOffset;
  });
}

export function formatDayLabel(day: string): string {
  const index = getDayIndex(day);
  if (index < 0 || index > 6) {
    return day;
  }

  return DAY_LABELS[index] ?? day;
}
