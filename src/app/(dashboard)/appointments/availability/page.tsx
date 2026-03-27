"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { PageHeader } from "@/components/layout/PageHeader";
import {
  useAvailableSlots,
  useAvailability,
  useDeleteAvailability,
  useUpdateAvailability,
  useUpdateWeeklyAvailabilityPattern,
  useWeeklyAvailabilityPattern,
} from "@/hooks/useAvailability";
import { useToast } from "@/hooks/use-toast";

const APPT_SUBNAV = [
  { href: "/appointments", label: "All Appointments" },
  { href: "/appointments/calendar", label: "Calendar" },
  { href: "/appointments/availability", label: "Availability" },
  { href: "/appointments/consultants", label: "Consultants" },
  { href: "/appointments/reminders", label: "Reminders" },
];

const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DEFAULT_SLOTS = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

type AvailabilityItem = {
  id: string;
  consultantId?: string;
  date: string;
  slots: string[];
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
};

type WeeklyPatternItem = {
  weekday: number;
  consultantId?: string;
  isEnabled: boolean;
  startTime: string;
  endTime: string;
  slotDuration: number;
};

function buildDefaultWeeklyPattern(): WeeklyPatternItem[] {
  return [
    { weekday: 0, isEnabled: false, startTime: "10:00", endTime: "14:00", slotDuration: 90 },
    { weekday: 1, isEnabled: true, startTime: "09:00", endTime: "17:00", slotDuration: 60 },
    { weekday: 2, isEnabled: true, startTime: "09:00", endTime: "17:00", slotDuration: 60 },
    { weekday: 3, isEnabled: true, startTime: "09:00", endTime: "17:00", slotDuration: 60 },
    { weekday: 4, isEnabled: true, startTime: "09:00", endTime: "17:00", slotDuration: 60 },
    { weekday: 5, isEnabled: true, startTime: "09:00", endTime: "16:00", slotDuration: 60 },
    { weekday: 6, isEnabled: true, startTime: "10:00", endTime: "16:00", slotDuration: 90 },
  ];
}

function normalizeWeeklyPattern(items: WeeklyPatternItem[]): WeeklyPatternItem[] {
  const byWeekday = new Map(items.map((item) => [item.weekday, item]));
  return buildDefaultWeeklyPattern().map((fallback) => ({
    ...fallback,
    ...(byWeekday.get(fallback.weekday) ?? {}),
  }));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function AvailabilityPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"weekly" | "blocked" | "slots">("slots");
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [blockedDateInput, setBlockedDateInput] = useState(todayKey());
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);

  const availabilityQuery = useAvailability();
  const slotQuery = useAvailableSlots(selectedDate);
  const saveAvailability = useUpdateAvailability();
  const deleteAvailability = useDeleteAvailability();
  const weeklyPatternQuery = useWeeklyAvailabilityPattern();
  const saveWeeklyPattern = useUpdateWeeklyAvailabilityPattern();
  const [weeklyPattern, setWeeklyPattern] = useState<WeeklyPatternItem[]>(
    buildDefaultWeeklyPattern(),
  );

  const availabilityItems = ((availabilityQuery.data as { data?: AvailabilityItem[] } | undefined)
    ?.data ?? []) as AvailabilityItem[];

  const blockedDates = useMemo(
    () => availabilityItems.filter((item) => item.isBlocked),
    [availabilityItems],
  );

  const configuredDates = useMemo(
    () => availabilityItems.filter((item) => !item.isBlocked),
    [availabilityItems],
  );

  const existingForDate = useMemo(
    () => availabilityItems.find((item) => item.date === selectedDate),
    [availabilityItems, selectedDate],
  );

  useEffect(() => {
    const data =
      (weeklyPatternQuery.data as { data?: WeeklyPatternItem[] } | undefined)?.data ?? [];
    setWeeklyPattern(normalizeWeeklyPattern(data));
  }, [weeklyPatternQuery.data]);

  const slotOptions = useMemo(() => {
    const data = slotQuery.data as Array<{ time: string; available: boolean }> | undefined;
    if (existingForDate?.slots?.length) return existingForDate.slots;
    if (data?.length) return data.map((item) => item.time);
    return DEFAULT_SLOTS;
  }, [existingForDate?.slots, slotQuery.data]);

  useEffect(() => {
    if (!existingForDate) {
      setSelectedSlots([]);
      setIsBlocked(false);
      return;
    }

    setSelectedSlots(existingForDate.slots);
    setIsBlocked(existingForDate.isBlocked);
  }, [existingForDate]);

  async function handleSave() {
    try {
      await saveAvailability.mutateAsync({
        date: selectedDate,
        slots: isBlocked ? [] : [...selectedSlots].sort(),
        isBlocked,
      });
      toast.success("Availability saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save availability";
      toast.error("Failed to save availability", message);
    }
  }

  async function handleRemove(id: string) {
    try {
      await deleteAvailability.mutateAsync(id);
      toast.success("Availability override removed");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete availability override";
      toast.error("Failed to delete availability", message);
    }
  }

  async function handleBlockDate() {
    try {
      await saveAvailability.mutateAsync({
        date: blockedDateInput,
        slots: [],
        isBlocked: true,
      });
      toast.success("Date blocked");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to block date";
      toast.error("Failed to block date", message);
    }
  }

  async function handleUnblockDate() {
    try {
      const blocked = blockedDates.find((item) => item.date === blockedDateInput);
      if (!blocked) {
        toast.error("Date is not blocked", "Select a blocked date to unblock it.");
        return;
      }

      await deleteAvailability.mutateAsync(blocked.id);
      toast.success("Date unblocked");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to unblock date";
      toast.error("Failed to unblock date", message);
    }
  }

  async function handleSaveWeeklyPattern() {
    try {
      const normalized = normalizeWeeklyPattern(weeklyPattern);

      await saveWeeklyPattern.mutateAsync({
        patterns: [...normalized].sort((a, b) => a.weekday - b.weekday),
      });

      toast.success("Weekly pattern saved");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save weekly pattern";
      toast.error("Failed to save weekly pattern", message);
    }
  }

  function updateWeeklyItem(weekday: number, patch: Partial<WeeklyPatternItem>) {
    setWeeklyPattern((current) =>
      current.map((item) => (item.weekday === weekday ? { ...item, ...patch } : item)),
    );
  }

  function toggleSlot(slot: string) {
    setSelectedSlots((current) =>
      current.includes(slot) ? current.filter((item) => item !== slot) : [...current, slot],
    );
  }

  return (
    <div className="avail-page">
      <div className="avail-page__topbar">
        <PageHeader
          title="Availability"
          description="Manage blocked dates and bookable times sent to the frontend booking flow."
          backHref="/appointments"
          backLabel="Appointments"
        />
        <button
          className="btn-primary"
          onClick={() => void handleSave()}
          disabled={saveAvailability.isPending}
        >
          {saveAvailability.isPending ? "Saving..." : "Save Availability"}
        </button>
      </div>

      <nav className="subnav">
        {APPT_SUBNAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`subnav__item${item.href === "/appointments/availability" ? "subnav__item--active" : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="avail-tabs">
        {[
          { key: "slots", label: "Date Slots" },
          { key: "blocked", label: "Blocked Dates" },
          { key: "weekly", label: "Default Weekly Pattern" },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`avail-tab${activeTab === tab.key ? "avail-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "slots" && (
        <div className="avail-card">
          <div className="avail-card__header">
            <h2 className="card-title">Date-specific availability</h2>
            <p className="card-sub">
              Select which times remain bookable on a given date. Times not selected here are
              treated as unavailable.
            </p>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="selected-date">Date</label>
              <input
                id="selected-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <label className="block-toggle">
              <input
                type="checkbox"
                checked={isBlocked}
                onChange={(e) => setIsBlocked(e.target.checked)}
              />
              <span>Block this date completely</span>
            </label>
          </div>

          <div className="slot-grid">
            {slotOptions.map((slot) => (
              <button
                key={slot}
                type="button"
                disabled={isBlocked}
                className={`slot-chip${selectedSlots.includes(slot) ? "slot-chip--selected" : ""}`}
                onClick={() => toggleSlot(slot)}
              >
                {slot}
              </button>
            ))}
          </div>

          <div className="note-box">
            Frontend booking should call <strong>/api/availability/slots?date=YYYY-MM-DD</strong>.
            This response now excludes blocked dates and already-booked appointment times
            automatically.
          </div>
        </div>
      )}

      {activeTab === "blocked" && (
        <div className="avail-card">
          <div className="avail-card__header">
            <h2 className="card-title">Blocked dates</h2>
            <p className="card-sub">These dates return no bookable slots to the frontend.</p>
          </div>
          <div className="blocked-controls">
            <div className="field">
              <label htmlFor="blocked-date">Date</label>
              <input
                id="blocked-date"
                type="date"
                value={blockedDateInput}
                onChange={(e) => setBlockedDateInput(e.target.value)}
              />
            </div>
            <div className="blocked-controls__actions">
              <button
                type="button"
                className="btn-primary"
                onClick={() => void handleBlockDate()}
                disabled={saveAvailability.isPending}
              >
                Block Date
              </button>
              <button
                type="button"
                className="btn-outline-danger"
                onClick={() => void handleUnblockDate()}
                disabled={deleteAvailability.isPending}
              >
                Unblock Date
              </button>
            </div>
          </div>
          <div className="list-grid">
            {blockedDates.length === 0 ? (
              <p className="empty-message">No blocked dates configured yet.</p>
            ) : (
              blockedDates.map((item) => (
                <div key={item.id} className="list-row">
                  <span>{item.date}</span>
                  <button
                    type="button"
                    className="danger-link"
                    onClick={() => void handleRemove(item.id)}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "weekly" && (
        <div className="avail-card">
          <div className="avail-card__header">
            <h2 className="card-title">Default weekly pattern</h2>
            <p className="card-sub">
              This fallback schedule is used whenever a date has no specific override stored.
            </p>
          </div>
          <div className="weekly-toolbar">
            <button
              className="btn-primary"
              onClick={() => void handleSaveWeeklyPattern()}
              disabled={saveWeeklyPattern.isPending || weeklyPatternQuery.isLoading}
            >
              {saveWeeklyPattern.isPending ? "Saving Pattern..." : "Save Weekly Pattern"}
            </button>
          </div>
          <div className="list-grid">
            {weeklyPatternQuery.isLoading ? (
              <p className="empty-message">Loading weekly schedule...</p>
            ) : weeklyPattern.length === 0 ? (
              <p className="empty-message">No weekly schedule found.</p>
            ) : (
              weeklyPattern.map((item) => (
                <div key={item.weekday} className="weekly-row weekly-row--editable">
                  <div className="weekly-row__day-wrap">
                    <span className="weekly-row__day">{WEEKDAY_LABELS[item.weekday]}</span>
                    <label className="block-toggle">
                      <input
                        type="checkbox"
                        checked={item.isEnabled}
                        onChange={(e) =>
                          updateWeeklyItem(item.weekday, { isEnabled: e.target.checked })
                        }
                      />
                      <span>Open</span>
                    </label>
                  </div>
                  <div className="weekly-row__inputs">
                    <input
                      type="time"
                      value={item.startTime}
                      disabled={!item.isEnabled}
                      onChange={(e) =>
                        updateWeeklyItem(item.weekday, { startTime: e.target.value })
                      }
                    />
                    <span>to</span>
                    <input
                      type="time"
                      value={item.endTime}
                      disabled={!item.isEnabled}
                      onChange={(e) => updateWeeklyItem(item.weekday, { endTime: e.target.value })}
                    />
                    <select
                      value={String(item.slotDuration)}
                      disabled={!item.isEnabled}
                      onChange={(e) =>
                        updateWeeklyItem(item.weekday, { slotDuration: Number(e.target.value) })
                      }
                    >
                      {[30, 45, 60, 90, 120].map((minutes) => (
                        <option key={minutes} value={minutes}>
                          {minutes} min
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="avail-card">
        <div className="avail-card__header">
          <h2 className="card-title">Saved overrides</h2>
          <p className="card-sub">
            These are the date-level records currently used by the booking API.
          </p>
        </div>
        <div className="list-grid">
          {configuredDates.length === 0 ? (
            <p className="empty-message">No date-specific slot overrides saved yet.</p>
          ) : (
            configuredDates.map((item) => (
              <div key={item.id} className="list-row list-row--stacked">
                <div>
                  <strong>{item.date}</strong>
                  <p>{item.slots.join(", ") || "No slots selected"}</p>
                </div>
                <button
                  type="button"
                  className="danger-link"
                  onClick={() => void handleRemove(item.id)}
                >
                  Delete Override
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .avail-page { display: flex; flex-direction: column; gap: 24px; }
        .avail-page__topbar { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .btn-primary { display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 16px; background: #1A1A18; color: #F5F0E8; border: none; border-radius: 8px; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: background 0.15s; margin-top: 4px; }
        .btn-primary:hover { background: #2E2E2A; }
        .btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }
        .subnav { display: flex; gap: 2px; border-bottom: 1.5px solid #E8E6E1; overflow-x: auto; }
        .subnav__item { height: 38px; padding: 0 14px; display: flex; align-items: center; font-size: 0.875rem; font-weight: 500; color: #6B6B68; text-decoration: none; border-bottom: 2px solid transparent; margin-bottom: -1.5px; white-space: nowrap; transition: color 0.15s; }
        .subnav__item:hover { color: #1A1A18; }
        .subnav__item--active { color: #1A1A18; font-weight: 600; border-bottom-color: #1A1A18; }
        .avail-tabs { display: flex; gap: 4px; background: #F0EDE8; border-radius: 10px; padding: 4px; width: fit-content; }
        .avail-tab { height: 34px; padding: 0 16px; border: none; border-radius: 7px; background: none; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; font-weight: 500; color: #6B6B68; cursor: pointer; }
        .avail-tab--active { background: #FFFFFF; color: #1A1A18; font-weight: 600; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
        .avail-card { background: #FFFFFF; border: 1.5px solid #E8E6E1; border-radius: 14px; padding: 24px; display: flex; flex-direction: column; gap: 20px; }
        .avail-card__header { display: flex; flex-direction: column; gap: 4px; }
        .card-title { font-family: 'Playfair Display', Georgia, serif; font-size: 1.125rem; font-weight: 700; color: #1A1A18; }
        .card-sub { font-size: 0.875rem; color: #6B6B68; }
        .field-row { display: flex; align-items: end; gap: 16px; flex-wrap: wrap; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field label { font-size: 0.875rem; font-weight: 500; color: #1A1A18; }
        .field input { height: 40px; padding: 0 12px; border: 1.5px solid #E8E6E1; border-radius: 10px; }
        .block-toggle { display: inline-flex; align-items: center; gap: 10px; font-size: 0.875rem; font-weight: 500; color: #1A1A18; }
        .slot-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; }
        .slot-chip { height: 40px; border: 1.5px solid #E8E6E1; border-radius: 10px; background: #FAFAF8; color: #1A1A18; font-size: 0.875rem; font-weight: 500; cursor: pointer; }
        .slot-chip--selected { background: #1A1A18; color: #F5F0E8; border-color: #1A1A18; }
        .slot-chip:disabled { opacity: 0.45; cursor: not-allowed; }
        .blocked-controls { display: flex; align-items: end; gap: 12px; flex-wrap: wrap; }
        .blocked-controls__actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .btn-outline-danger { display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 16px; background: #FFFFFF; color: #AF3E34; border: 1.5px solid #E8C9C4; border-radius: 8px; font-family: 'DM Sans', system-ui, sans-serif; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: background 0.15s; margin-top: 4px; }
        .btn-outline-danger:hover { background: #FFF6F5; }
        .btn-outline-danger:disabled { opacity: 0.65; cursor: not-allowed; }
        .note-box { padding: 12px 14px; border-radius: 10px; background: #F7F5F0; border: 1px solid #E8E0D0; color: #6B6B68; font-size: 0.875rem; line-height: 1.6; }
        .list-grid { display: flex; flex-direction: column; gap: 10px; }
        .list-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; border: 1.5px solid #E8E6E1; border-radius: 10px; background: #FAFAF8; }
        .list-row--stacked { align-items: flex-start; }
        .list-row--stacked p { margin-top: 4px; font-size: 0.8125rem; color: #6B6B68; }
        .weekly-toolbar { display: flex; justify-content: flex-end; }
        .weekly-row { display: grid; grid-template-columns: 160px 1fr 120px; gap: 12px; padding: 12px 14px; border: 1.5px solid #E8E6E1; border-radius: 10px; background: #FAFAF8; }
        .weekly-row--editable { grid-template-columns: 220px 1fr; align-items: center; }
        .weekly-row__day-wrap { display: flex; flex-direction: column; gap: 8px; }
        .weekly-row__inputs { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .weekly-row__inputs input, .weekly-row__inputs select { height: 36px; padding: 0 10px; border: 1.5px solid #E8E6E1; border-radius: 8px; background: #FFFFFF; }
        .weekly-row__day { font-weight: 600; color: #1A1A18; }
        .weekly-row__hours, .weekly-row__duration { color: #6B6B68; font-size: 0.875rem; }
        .danger-link { border: none; background: none; color: #AF3E34; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
        .empty-message { color: #6B6B68; font-size: 0.875rem; }
        @media (max-width: 720px) { .weekly-row { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

export const dynamic = "force-dynamic";
