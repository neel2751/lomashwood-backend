"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { useCreateShowroom, useUpdateShowroom } from "@/hooks/useShowrooms";
import type {
  CreateShowroomPayload,
  Showroom,
  ShowroomDisplayProduct,
  ShowroomOpeningHour,
  ShowroomTeamMember,
} from "@/types/showroom.types";

type ShowroomFormProps = {
  showroomId?: string;
  initialData?: Showroom;
};

function safeStringify(value: unknown): string {
  if (!value) return "[]";
  return JSON.stringify(value, null, 2);
}

function parseJsonArray<T>(value: string, fallback: T[]): T[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

export function ShowroomForm({ showroomId, initialData }: ShowroomFormProps) {
  const router = useRouter();
  const createShowroom = useCreateShowroom();
  const updateShowroom = useUpdateShowroom();

  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [name, setName] = useState(initialData?.name ?? "");
  const [city, setCity] = useState(initialData?.city ?? "");
  const [address, setAddress] = useState(initialData?.address ?? "");
  const [postcode, setPostcode] = useState(initialData?.postcode ?? "");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [lat, setLat] = useState(String(initialData?.latitude ?? ""));
  const [lng, setLng] = useState(String(initialData?.longitude ?? ""));
  const [image, setImage] = useState(initialData?.image ?? "");
  const [openToday, setOpenToday] = useState(initialData?.openToday ?? "");
  const [facilitiesText, setFacilitiesText] = useState((initialData?.facilities ?? []).join("\n"));
  const [teamText, setTeamText] = useState(safeStringify(initialData?.team));
  const [kitchensText, setKitchensText] = useState(safeStringify(initialData?.displayProducts));
  const [openingHoursText, setOpeningHoursText] = useState(safeStringify(initialData?.openingHours));
  const [nearbyStoresText, setNearbyStoresText] = useState((initialData?.nearbyStores ?? []).join(", "));
  const [error, setError] = useState<string | null>(null);

  const isSaving = createShowroom.isPending || updateShowroom.isPending;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const latitude = Number(lat);
    const longitude = Number(lng);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setError("Latitude and longitude must be valid numbers.");
      return;
    }

    const payload: CreateShowroomPayload = {
      slug: slug.trim(),
      name: name.trim(),
      city: city.trim(),
      address: address.trim(),
      postcode: postcode.trim(),
      phone: phone.trim(),
      email: email.trim(),
      coordinates: {
        lat: latitude,
        lng: longitude,
      },
      image: image.trim() || undefined,
      openToday: openToday.trim() || undefined,
      facilities: facilitiesText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      team: parseJsonArray<ShowroomTeamMember>(teamText, []),
      displayProducts: parseJsonArray<ShowroomDisplayProduct>(kitchensText, []),
      openingHours: parseJsonArray<ShowroomOpeningHour>(openingHoursText, []),
      nearbyStores: nearbyStoresText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    try {
      if (showroomId) {
        await updateShowroom.mutateAsync({ id: showroomId, payload });
      } else {
        await createShowroom.mutateAsync(payload);
      }

      router.push("/appointments/showrooms");
      router.refresh();
    } catch (submitError: any) {
      setError(submitError?.message ?? "Failed to save showroom.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-[#E8E6E1] bg-white p-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-[#6B6B68]">
          Slug
          <input value={slug} onChange={(e) => setSlug(e.target.value)} className="h-10 rounded-md border border-[#E8E6E1] px-3" required />
        </label>
        <label className="flex flex-col gap-1 text-sm text-[#6B6B68]">
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} className="h-10 rounded-md border border-[#E8E6E1] px-3" required />
        </label>
        <label className="flex flex-col gap-1 text-sm text-[#6B6B68]">
          City
          <input value={city} onChange={(e) => setCity(e.target.value)} className="h-10 rounded-md border border-[#E8E6E1] px-3" required />
        </label>
        <label className="flex flex-col gap-1 text-sm text-[#6B6B68]">
          Postcode
          <input value={postcode} onChange={(e) => setPostcode(e.target.value)} className="h-10 rounded-md border border-[#E8E6E1] px-3" required />
        </label>
        <label className="flex flex-col gap-1 text-sm text-[#6B6B68] md:col-span-2">
          Address
          <input value={address} onChange={(e) => setAddress(e.target.value)} className="h-10 rounded-md border border-[#E8E6E1] px-3" required />
        </label>
        <label className="flex flex-col gap-1 text-sm text-[#6B6B68]">
          Phone
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10 rounded-md border border-[#E8E6E1] px-3" required />
        </label>
        <label className="flex flex-col gap-1 text-sm text-[#6B6B68]">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 rounded-md border border-[#E8E6E1] px-3" required />
        </label>
        <label className="flex flex-col gap-1 text-sm text-[#6B6B68]">
          Latitude
          <input value={lat} onChange={(e) => setLat(e.target.value)} className="h-10 rounded-md border border-[#E8E6E1] px-3" required />
        </label>
        <label className="flex flex-col gap-1 text-sm text-[#6B6B68]">
          Longitude
          <input value={lng} onChange={(e) => setLng(e.target.value)} className="h-10 rounded-md border border-[#E8E6E1] px-3" required />
        </label>
        <label className="flex flex-col gap-1 text-sm text-[#6B6B68] md:col-span-2">
          Image URL
          <input value={image} onChange={(e) => setImage(e.target.value)} className="h-10 rounded-md border border-[#E8E6E1] px-3" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-[#6B6B68] md:col-span-2">
          Open Today
          <input value={openToday} onChange={(e) => setOpenToday(e.target.value)} className="h-10 rounded-md border border-[#E8E6E1] px-3" />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm text-[#6B6B68]">
        Facilities (one per line)
        <textarea value={facilitiesText} onChange={(e) => setFacilitiesText(e.target.value)} className="min-h-[120px] rounded-md border border-[#E8E6E1] p-3" />
      </label>

      <label className="flex flex-col gap-1 text-sm text-[#6B6B68]">
        Team JSON
        <textarea value={teamText} onChange={(e) => setTeamText(e.target.value)} className="min-h-[140px] rounded-md border border-[#E8E6E1] p-3 font-mono text-xs" />
      </label>

      <label className="flex flex-col gap-1 text-sm text-[#6B6B68]">
        Display Products JSON
        <textarea value={kitchensText} onChange={(e) => setKitchensText(e.target.value)} className="min-h-[140px] rounded-md border border-[#E8E6E1] p-3 font-mono text-xs" />
      </label>

      <label className="flex flex-col gap-1 text-sm text-[#6B6B68]">
        Opening Hours JSON
        <textarea value={openingHoursText} onChange={(e) => setOpeningHoursText(e.target.value)} className="min-h-[140px] rounded-md border border-[#E8E6E1] p-3 font-mono text-xs" />
      </label>

      <label className="flex flex-col gap-1 text-sm text-[#6B6B68]">
        Nearby Stores (comma separated slugs)
        <input value={nearbyStoresText} onChange={(e) => setNearbyStoresText(e.target.value)} className="h-10 rounded-md border border-[#E8E6E1] px-3" />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => router.push("/appointments/showrooms")} className="h-10 rounded-md border border-[#E8E6E1] px-4 text-sm">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="h-10 rounded-md bg-[#1A1A18] px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          {isSaving ? "Saving..." : showroomId ? "Update Showroom" : "Create Showroom"}
        </button>
      </div>
    </form>
  );
}
