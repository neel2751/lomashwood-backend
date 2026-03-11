"use client";

import { type FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Upload } from "lucide-react";

import { useProducts } from "@/hooks/useProducts";
import type {
  CreateShowroomPayload,
  Showroom,
  ShowroomDisplayProduct,
  ShowroomOpeningHour,
  ShowroomTeamMember,
} from "@/types/showroom.types";

type ShowroomFormValues = {
  slug: string;
  name: string;
  city: string;
  address: string;
  postcode: string;
  phone: string;
  email: string;
  latitude: string;
  longitude: string;
  image: string;
  imageMediaId: string;
  openToday: string;
  facilitiesText: string;
  nearbyStoresText: string;
  team: ShowroomTeamMember[];
  displayProducts: ShowroomDisplayProduct[];
  openingHours: ShowroomOpeningHour[];
};
interface ShowroomFormProps {
  mode: "create" | "edit";
  initialData?: Showroom;
  isSubmitting?: boolean;
  onSubmit: (payload: CreateShowroomPayload) => Promise<void> | void;
}

function defaultValues(initialData?: Showroom): ShowroomFormValues {
  if (!initialData) {
    return {
      slug: "",
      name: "",
      city: "",
      address: "",
      postcode: "",
      phone: "",
      email: "",
      latitude: "",
      longitude: "",
      image: "",
      imageMediaId: "",
      openToday: "",
      facilitiesText: "",
      nearbyStoresText: "",
      team: [{ name: "", role: "" }],
      displayProducts: [{ productId: "", isPrimary: false }],
      openingHours: [{ day: "", hours: "" }],
    };
  }

  return {
    slug: initialData.slug,
    name: initialData.name,
    city: initialData.city,
    address: initialData.address,
    postcode: initialData.postcode,
    phone: initialData.phone,
    email: initialData.email,
    latitude: String(initialData.latitude),
    longitude: String(initialData.longitude),
    image: initialData.image || "",
    imageMediaId: initialData.imageMediaId || "",
    openToday: initialData.openToday || "",
    facilitiesText: initialData.facilities.join(", "),
    nearbyStoresText: initialData.nearbyStores.join(", "),
    team: initialData.team.length > 0 ? initialData.team : [{ name: "", role: "" }],
    displayProducts:
      initialData.displayProducts.length > 0
        ? initialData.displayProducts.map((entry) => ({
            productId: entry.productId,
            isPrimary: entry.isPrimary,
          }))
        : [{ productId: "", isPrimary: false }],
    openingHours:
      initialData.openingHours.length > 0
        ? initialData.openingHours
        : [{ day: "", hours: "" }],
  };
}

function splitCsv(input: string): string[] {
  return input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function ShowroomForm({ mode, initialData, isSubmitting = false, onSubmit }: ShowroomFormProps) {
  const [form, setForm] = useState<ShowroomFormValues>(defaultValues(initialData));
  const [error, setError] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: kitchensData } = useProducts({ page: 1, limit: 200, category: "kitchen" });
  const { data: bedroomsData } = useProducts({ page: 1, limit: 200, category: "bedroom" });

  const productOptions = useMemo(() => {
    const kitchenItems = Array.isArray((kitchensData as { data?: unknown[] } | undefined)?.data)
      ? ((kitchensData as { data: unknown[] }).data as Array<Record<string, unknown>>)
      : [];
    const bedroomItems = Array.isArray((bedroomsData as { data?: unknown[] } | undefined)?.data)
      ? ((bedroomsData as { data: unknown[] }).data as Array<Record<string, unknown>>)
      : [];

    return [...kitchenItems, ...bedroomItems].map((item) => ({
      id: String(item.id),
      title: String(item.title),
      category: String(item.category),
    }));
  }, [kitchensData, bedroomsData]);

  const heading = useMemo(
    () => (mode === "create" ? "Create Showroom" : "Edit Showroom"),
    [mode],
  );

  const submitLabel = mode === "create" ? "Create showroom" : "Save changes";

  const updateField = (key: keyof ShowroomFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpload = async (file?: File) => {
    if (!file) return;

    try {
      setIsUploading(true);
      setError("");

      const presignResponse = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          folder: "showrooms",
        }),
      });

      if (!presignResponse.ok) {
        const message = await presignResponse.text();
        throw new Error(message || "Failed to prepare image upload");
      }

      const { uploadUrl, fileUrl, mediaId } = (await presignResponse.json()) as {
        uploadUrl: string;
        fileUrl: string;
        mediaId: string;
      };

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      setForm((prev) => ({ ...prev, image: fileUrl, imageMediaId: mediaId }));
    } catch (uploadError: any) {
      setError(uploadError?.message || "Image upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const lat = Number(form.latitude);
    const lng = Number(form.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError("Latitude and longitude must be valid numbers.");
      return;
    }

    const payload: CreateShowroomPayload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      city: form.city.trim(),
      address: form.address.trim(),
      postcode: form.postcode.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      coordinates: {
        lat,
        lng,
      },
      image: form.image.trim() || undefined,
      imageMediaId: form.imageMediaId.trim() || undefined,
      openToday: form.openToday.trim() || undefined,
      facilities: splitCsv(form.facilitiesText),
      nearbyStores: splitCsv(form.nearbyStoresText),
      team: form.team.filter((member) => member.name.trim() && member.role.trim()),
      displayProducts: form.displayProducts.filter((entry) => entry.productId.trim()),
      openingHours: form.openingHours.filter(
        (hour) => hour.day.trim() && hour.hours.trim(),
      ),
    };

    try {
      await onSubmit(payload);
    } catch (submitError: any) {
      setError(submitError?.message || "Failed to save showroom");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F1E8]">{heading}</h1>
          <p className="text-sm text-[#8F7553]">Manage your showroom details and display content.</p>
        </div>
        <Link
          href="/showrooms"
          className="px-4 py-2 rounded-[10px] bg-[#2E231A] text-[#F5F1E8] hover:bg-[#3D2E1E] transition-colors"
        >
          Back
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#F5F1E8]">Basic Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={form.name} onChange={(e) => updateField("name", e.target.value)} required placeholder="Showroom name" className="px-3 py-2.5 rounded-[10px] bg-[#0F0A06] border border-[#2E231A] text-[#F5F1E8]" />
            <input value={form.slug} onChange={(e) => updateField("slug", e.target.value)} required placeholder="slug-name" className="px-3 py-2.5 rounded-[10px] bg-[#0F0A06] border border-[#2E231A] text-[#F5F1E8]" />
            <input value={form.city} onChange={(e) => updateField("city", e.target.value)} required placeholder="City" className="px-3 py-2.5 rounded-[10px] bg-[#0F0A06] border border-[#2E231A] text-[#F5F1E8]" />
            <input value={form.postcode} onChange={(e) => updateField("postcode", e.target.value)} required placeholder="Postcode" className="px-3 py-2.5 rounded-[10px] bg-[#0F0A06] border border-[#2E231A] text-[#F5F1E8]" />
            <input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} required placeholder="Phone" className="px-3 py-2.5 rounded-[10px] bg-[#0F0A06] border border-[#2E231A] text-[#F5F1E8]" />
            <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} required placeholder="Email" className="px-3 py-2.5 rounded-[10px] bg-[#0F0A06] border border-[#2E231A] text-[#F5F1E8]" />
            <input value={form.latitude} onChange={(e) => updateField("latitude", e.target.value)} required placeholder="Latitude" className="px-3 py-2.5 rounded-[10px] bg-[#0F0A06] border border-[#2E231A] text-[#F5F1E8]" />
            <input value={form.longitude} onChange={(e) => updateField("longitude", e.target.value)} required placeholder="Longitude" className="px-3 py-2.5 rounded-[10px] bg-[#0F0A06] border border-[#2E231A] text-[#F5F1E8]" />
          </div>
          <textarea value={form.address} onChange={(e) => updateField("address", e.target.value)} required placeholder="Address" rows={2} className="w-full px-3 py-2.5 rounded-[10px] bg-[#0F0A06] border border-[#2E231A] text-[#F5F1E8]" />
          <input value={form.openToday} onChange={(e) => updateField("openToday", e.target.value)} placeholder="Open today (e.g. 9:00 AM - 6:00 PM)" className="w-full px-3 py-2.5 rounded-[10px] bg-[#0F0A06] border border-[#2E231A] text-[#F5F1E8]" />
        </section>

        <section className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#F5F1E8]">Showroom Image</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] bg-[#2E231A] text-[#F5F1E8] cursor-pointer hover:bg-[#3D2E1E] transition-colors">
              <Upload className="w-4 h-4" />
              {isUploading ? "Uploading..." : "Upload from computer"}
              <input
                type="file"
                accept="image/*"
                disabled={isUploading || isSubmitting}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  void handleUpload(file);
                }}
              />
            </label>
            <input
              value={form.image}
              onChange={(e) => updateField("image", e.target.value)}
              placeholder="Image URL"
              className="flex-1 px-3 py-2.5 rounded-[10px] bg-[#0F0A06] border border-[#2E231A] text-[#F5F1E8]"
            />
          </div>
        </section>

        <section className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#F5F1E8]">Facilities and Nearby Stores</h2>
          <textarea
            value={form.facilitiesText}
            onChange={(e) => updateField("facilitiesText", e.target.value)}
            rows={3}
            placeholder="Facilities as comma-separated values"
            className="w-full px-3 py-2.5 rounded-[10px] bg-[#0F0A06] border border-[#2E231A] text-[#F5F1E8]"
          />
          <textarea
            value={form.nearbyStoresText}
            onChange={(e) => updateField("nearbyStoresText", e.target.value)}
            rows={2}
            placeholder="Nearby store slugs as comma-separated values"
            className="w-full px-3 py-2.5 rounded-[10px] bg-[#0F0A06] border border-[#2E231A] text-[#F5F1E8]"
          />
        </section>

        <section className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#F5F1E8]">Team Members</h2>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, team: [...prev.team, { name: "", role: "" }] }))}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-[10px] bg-[#2E231A] text-[#F5F1E8]"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          {form.team.map((member, idx) => (
            <div key={`team-${idx}`} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
              <input
                value={member.name}
                onChange={(e) => {
                  const next = [...form.team];
                  const current = next[idx] || { name: "", role: "" };
                  next[idx] = { ...current, name: e.target.value };
                  setForm((prev) => ({ ...prev, team: next }));
                }}
                placeholder="Name"
                className="px-3 py-2.5 rounded-[10px] bg-[#0F0A06] border border-[#2E231A] text-[#F5F1E8]"
              />
              <input
                value={member.role}
                onChange={(e) => {
                  const next = [...form.team];
                  const current = next[idx] || { name: "", role: "" };
                  next[idx] = { ...current, role: e.target.value };
                  setForm((prev) => ({ ...prev, team: next }));
                }}
                placeholder="Role"
                className="px-3 py-2.5 rounded-[10px] bg-[#0F0A06] border border-[#2E231A] text-[#F5F1E8]"
              />
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, team: prev.team.filter((_, i) => i !== idx) }))}
                className="px-3 py-2.5 rounded-[10px] bg-red-500/15 text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </section>

        <section className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#F5F1E8]">Kitchens & Bedrooms on Display</h2>
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  displayProducts: [...prev.displayProducts, { productId: "", isPrimary: false }],
                }))
              }
              className="inline-flex items-center gap-2 px-3 py-2 rounded-[10px] bg-[#2E231A] text-[#F5F1E8]"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          {form.displayProducts.map((entry, idx) => (
            <div key={`display-${idx}`} className="space-y-3 rounded-[10px] p-4 bg-[#0F0A06] border border-[#2E231A]">
              <select
                value={entry.productId}
                onChange={(e) => {
                  const next = [...form.displayProducts];
                  next[idx] = { ...next[idx], productId: e.target.value };
                  setForm((prev) => ({ ...prev, displayProducts: next }));
                }}
                className="w-full px-3 py-2.5 rounded-[10px] bg-[#1C1611] border border-[#2E231A] text-[#F5F1E8]"
              >
                <option value="">Select product from database</option>
                {productOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.title} ({option.category})
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-[#8F7553]">
                  <input
                    type="checkbox"
                    checked={!!entry.isPrimary}
                    onChange={(e) => {
                      const next = form.displayProducts.map((item, index) => ({
                        ...item,
                        isPrimary: index === idx ? e.target.checked : false,
                      }));
                      setForm((prev) => ({ ...prev, displayProducts: next }));
                    }}
                  />
                  Primary display
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      displayProducts: prev.displayProducts.filter((_, i) => i !== idx),
                    }))
                  }
                  className="px-3 py-2 rounded-[10px] bg-red-500/15 text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#F5F1E8]">Opening Hours</h2>
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  openingHours: [...prev.openingHours, { day: "", hours: "" }],
                }))
              }
              className="inline-flex items-center gap-2 px-3 py-2 rounded-[10px] bg-[#2E231A] text-[#F5F1E8]"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          {form.openingHours.map((hour, idx) => (
            <div key={`hour-${idx}`} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
              <input
                value={hour.day}
                onChange={(e) => {
                  const next = [...form.openingHours];
                  const current = next[idx] || { day: "", hours: "" };
                  next[idx] = { ...current, day: e.target.value };
                  setForm((prev) => ({ ...prev, openingHours: next }));
                }}
                placeholder="Day"
                className="px-3 py-2.5 rounded-[10px] bg-[#0F0A06] border border-[#2E231A] text-[#F5F1E8]"
              />
              <input
                value={hour.hours}
                onChange={(e) => {
                  const next = [...form.openingHours];
                  const current = next[idx] || { day: "", hours: "" };
                  next[idx] = { ...current, hours: e.target.value };
                  setForm((prev) => ({ ...prev, openingHours: next }));
                }}
                placeholder="Hours"
                className="px-3 py-2.5 rounded-[10px] bg-[#0F0A06] border border-[#2E231A] text-[#F5F1E8]"
              />
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    openingHours: prev.openingHours.filter((_, i) => i !== idx),
                  }))
                }
                className="px-3 py-2.5 rounded-[10px] bg-red-500/15 text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </section>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="px-5 py-3 rounded-[10px] bg-[#C8924A] hover:bg-[#B07F3F] text-white font-medium disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </form>
    </div>
  );
}