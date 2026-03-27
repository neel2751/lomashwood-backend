"use client";

import { useEffect, useMemo, useState } from "react";

import { useAvailableSlots } from "@/hooks/useAvailability";
import { useConsultants } from "@/hooks/useConsultants";
import { useShowrooms } from "@/hooks/useShowrooms";

import type { AppointmentType, CreateAppointmentPayload } from "@/types/appointment.types";

type ConsultantOption = {
  id: string;
  name: string;
  status?: "active" | "inactive";
};

type ShowroomOption = {
  id: string;
  name: string;
};

type SlotOption = {
  id: string;
  time: string;
  date: string;
  available: boolean;
};

type AppointmentEditorFormProps = {
  initialData?: Partial<CreateAppointmentPayload>;
  submitLabel: string;
  onSubmit: (payload: CreateAppointmentPayload) => Promise<void> | void;
  isSubmitting?: boolean;
};

function toDateInputValue(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function toTimeInputValue(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(11, 16);
}

export function AppointmentEditorForm({
  initialData,
  submitLabel,
  onSubmit,
  isSubmitting = false,
}: AppointmentEditorFormProps) {
  const inputClassName =
    "h-10 rounded-[10px] border border-[#E8E6E1] bg-white px-3 text-[13px] text-[#1A1A18] placeholder:text-[#A8A39A] focus:border-[#8B6914]/30 focus:outline-none";
  const selectClassName =
    "h-10 rounded-[10px] border border-[#E8E6E1] bg-white px-3 text-[13px] text-[#1A1A18] focus:border-[#8B6914]/30 focus:outline-none";
  const textareaClassName =
    "rounded-[10px] border border-[#E8E6E1] bg-white px-3 py-2 text-[13px] text-[#1A1A18] placeholder:text-[#A8A39A] focus:border-[#8B6914]/30 focus:outline-none";

  const [type, setType] = useState<AppointmentType>(initialData?.type ?? "home");
  const [forKitchen, setForKitchen] = useState(initialData?.forKitchen ?? true);
  const [forBedroom, setForBedroom] = useState(initialData?.forBedroom ?? false);
  const [customerName, setCustomerName] = useState(initialData?.customerName ?? "");
  const [customerEmail, setCustomerEmail] = useState(initialData?.customerEmail ?? "");
  const [customerPhone, setCustomerPhone] = useState(initialData?.customerPhone ?? "");
  const [address, setAddress] = useState(initialData?.address ?? "");
  const [postcode, setPostcode] = useState(initialData?.postcode ?? "");
  const [consultantId, setConsultantId] = useState(initialData?.consultantId ?? "");
  const [showroomId, setShowroomId] = useState(initialData?.showroomId ?? "");
  const [slotDate, setSlotDate] = useState(toDateInputValue(initialData?.slot));
  const [slotTime, setSlotTime] = useState(toTimeInputValue(initialData?.slot));
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  const consultantsQuery = useConsultants();
  const showroomsQuery = useShowrooms({ page: 1, limit: 100 });
  const slotsQuery = useAvailableSlots(slotDate || undefined, consultantId || undefined);

  const consultants = useMemo(() => {
    const rows = ((consultantsQuery.data as { data?: ConsultantOption[] } | undefined)?.data ??
      []) as ConsultantOption[];
    return rows.filter((item) => !item.status || item.status === "active");
  }, [consultantsQuery.data]);

  const showrooms = useMemo(
    () =>
      ((showroomsQuery.data as { data?: ShowroomOption[] } | undefined)?.data ??
        []) as ShowroomOption[],
    [showroomsQuery.data],
  );

  const slotOptions = useMemo(() => {
    const rows = (slotsQuery.data ?? []) as SlotOption[];
    return rows.filter((slot) => slot.available || slot.time === slotTime);
  }, [slotsQuery.data, slotTime]);

  const availableSlotsCount = useMemo(() => {
    const rows = (slotsQuery.data ?? []) as SlotOption[];
    return rows.filter((slot) => slot.available).length;
  }, [slotsQuery.data]);

  useEffect(() => {
    if (!slotDate) {
      setSlotTime("");
      return;
    }

    if (!slotTime) {
      return;
    }

    const slotStillExists = slotOptions.some((slot) => slot.time === slotTime);
    if (!slotStillExists) {
      setSlotTime("");
    }
  }, [slotDate, slotTime, slotOptions]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!customerName.trim()) {
      setFormError("Customer name is required.");
      return;
    }

    if (!customerEmail.trim()) {
      setFormError("Customer email is required.");
      return;
    }

    if (!customerPhone.trim()) {
      setFormError("Customer phone is required.");
      return;
    }

    if (!address.trim()) {
      setFormError("Address is required.");
      return;
    }

    if (!postcode.trim()) {
      setFormError("Postcode is required.");
      return;
    }

    if (!forKitchen && !forBedroom) {
      setFormError("Select at least one interest (Kitchen or Bedroom).");
      return;
    }

    if (!slotDate || !slotTime) {
      setFormError("Please select an available date and time slot.");
      return;
    }

    const slot = `${slotDate}T${slotTime}:00.000Z`;

    await onSubmit({
      type,
      forKitchen,
      forBedroom,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      postcode: postcode.trim(),
      address: address.trim(),
      slot,
      consultantId: consultantId || undefined,
      showroomId: showroomId || undefined,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-[16px] border border-[#E8E6E1] bg-white p-6"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-[12px] font-medium text-[#1A1A18]">
          Appointment Type
          <select
            value={type}
            onChange={(event) => setType(event.target.value as AppointmentType)}
            className={selectClassName}
          >
            <option value="home">Home Visit</option>
            <option value="showroom">Showroom</option>
            <option value="online">Online</option>
          </select>
        </label>

        <div className="flex flex-col gap-2 text-[12px] font-medium text-[#1A1A18]">
          Interest
          <div className="flex items-center gap-4 rounded-[10px] border border-[#E8E6E1] px-3 py-2">
            <label className="inline-flex items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={forKitchen}
                onChange={(event) => setForKitchen(event.target.checked)}
                className="h-4 w-4 rounded border-[#CFCAC0]"
              />
              Kitchen
            </label>
            <label className="inline-flex items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={forBedroom}
                onChange={(event) => setForBedroom(event.target.checked)}
                className="h-4 w-4 rounded border-[#CFCAC0]"
              />
              Bedroom
            </label>
          </div>
        </div>

        <label className="flex flex-col gap-1 text-[12px] font-medium text-[#1A1A18]">
          Customer Name
          <input
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            className={inputClassName}
            placeholder="Customer full name"
          />
        </label>

        <label className="flex flex-col gap-1 text-[12px] font-medium text-[#1A1A18]">
          Customer Email
          <input
            type="email"
            value={customerEmail}
            onChange={(event) => setCustomerEmail(event.target.value)}
            className={inputClassName}
            placeholder="name@example.com"
          />
        </label>

        <label className="flex flex-col gap-1 text-[12px] font-medium text-[#1A1A18]">
          Customer Phone
          <input
            value={customerPhone}
            onChange={(event) => setCustomerPhone(event.target.value)}
            className={inputClassName}
            placeholder="Phone number"
          />
        </label>

        <label className="flex flex-col gap-1 text-[12px] font-medium text-[#1A1A18]">
          Postcode
          <input
            value={postcode}
            onChange={(event) => setPostcode(event.target.value)}
            className={inputClassName}
            placeholder="SW1A 1AA"
          />
        </label>

        <label className="flex flex-col gap-1 text-[12px] font-medium text-[#1A1A18] md:col-span-2">
          Address
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className={inputClassName}
            placeholder="Full address"
          />
        </label>

        <label className="flex flex-col gap-1 text-[12px] font-medium text-[#1A1A18]">
          Consultant
          <select
            value={consultantId}
            onChange={(event) => {
              setConsultantId(event.target.value);
              setSlotTime("");
            }}
            className={selectClassName}
          >
            <option value="">Any consultant</option>
            {consultants.map((consultant) => (
              <option key={consultant.id} value={consultant.id}>
                {consultant.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-[12px] font-medium text-[#1A1A18]">
          Showroom
          <select
            value={showroomId}
            onChange={(event) => setShowroomId(event.target.value)}
            className={selectClassName}
          >
            <option value="">No showroom</option>
            {showrooms.map((showroom) => (
              <option key={showroom.id} value={showroom.id}>
                {showroom.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-[12px] font-medium text-[#1A1A18]">
          Slot Date
          <input
            type="date"
            value={slotDate}
            onChange={(event) => {
              setSlotDate(event.target.value);
              setSlotTime("");
            }}
            className={inputClassName}
          />
        </label>

        <label className="flex flex-col gap-1 text-[12px] font-medium text-[#1A1A18]">
          Available Time Slot
          <select
            value={slotTime}
            onChange={(event) => setSlotTime(event.target.value)}
            disabled={!slotDate || slotsQuery.isLoading}
            className={`${selectClassName} disabled:bg-[#F6F5F2] disabled:text-[#A8A39A]`}
          >
            <option value="">
              {slotDate ? "Select an available slot" : "Choose a date first"}
            </option>
            {slotOptions.map((slot) => (
              <option key={slot.id} value={slot.time}>
                {slot.time}
              </option>
            ))}
          </select>
          <div className="flex items-center justify-between gap-2 text-[11px] text-[#6B6B68]">
            <span>
              {slotsQuery.isLoading
                ? "Loading available slots..."
                : slotDate && slotOptions.length === 0
                  ? "No slots available for this date."
                  : "Only available slots are shown."}
            </span>
            {slotDate && !slotsQuery.isLoading && (
              <span className="rounded-full bg-[#F6F5F2] px-2 py-0.5 text-[10px] font-medium text-[#1A1A18]">
                {availableSlotsCount} slots
              </span>
            )}
          </div>
        </label>

        <label className="flex flex-col gap-1 text-[12px] font-medium text-[#1A1A18] md:col-span-2">
          Notes
          <textarea
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className={textareaClassName}
            placeholder="Optional notes for internal team"
          />
        </label>
      </div>

      {formError && (
        <div className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-600">
          {formError}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-10 items-center rounded-[10px] bg-[#1A1A18] px-5 text-[13px] font-medium text-white disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
