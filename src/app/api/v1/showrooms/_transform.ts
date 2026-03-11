import { getTodayHours, sortOpeningHoursFromToday } from "@/lib/showroom-hours";

import type { ShowroomOpeningHour } from "@/types/showroom.types";

type ShowroomListResponse = {
  data: Array<Record<string, any>>;
  [key: string]: any;
};

function toApiDay(day: string): string {
  return day.trim().slice(0, 3).toLowerCase();
}

function normalizeOpeningHours(openingHours: ShowroomOpeningHour[]) {
  return sortOpeningHoursFromToday(openingHours).map((hour) => ({
    day: toApiDay(hour.day),
    hours: hour.hours,
  }));
}

export function toV1Showroom(showroom: Record<string, any>) {
  const sourceOpeningHours = Array.isArray(showroom.openingHours)
    ? (showroom.openingHours as ShowroomOpeningHour[])
    : [];
  const openingHours = normalizeOpeningHours(sourceOpeningHours);

  return {
    ...showroom,
    openToday: getTodayHours(sourceOpeningHours) ?? showroom.openToday ?? null,
    openingHours,
  };
}

export function toV1ShowroomList(payload: ShowroomListResponse) {
  return {
    ...payload,
    data: payload.data.map(toV1Showroom),
  };
}
