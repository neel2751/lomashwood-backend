"use client";

import { type FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Building2,
  Clock,
  GripVertical,
  ImageIcon,
  Mail,
  MapPin,
  Phone,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";

import { useProducts } from "@/hooks/useProducts";
import { AddressMapPicker } from "@/components/showrooms/AddressMapPicker";
import type {
  CreateShowroomPayload,
  Showroom,
  ShowroomDisplayProduct,
  ShowroomOpeningHour,
  ShowroomTeamMember,
} from "@/types/showroom.types";

/* ── types ────────────────────────────────────────────────── */

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

/* ── helpers ──────────────────────────────────────────────── */

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
      initialData.openingHours.length > 0 ? initialData.openingHours : [{ day: "", hours: "" }],
  };
}

function splitCsv(input: string): string[] {
  return input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

/* ── shared classes ───────────────────────────────────────── */

const inputCls =
  "h-10 w-full rounded-[9px] border border-[#3D2E1E] bg-[#2E231A] px-3.5 text-[13px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:border-[#C8924A]/50 focus:outline-none transition-colors";

const textareaCls =
  "w-full rounded-[9px] border border-[#3D2E1E] bg-[#2E231A] px-3.5 py-2.5 text-[13px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:border-[#C8924A]/50 focus:outline-none transition-colors resize-none";

const selectCls =
  "h-10 w-full rounded-[9px] border border-[#3D2E1E] bg-[#2E231A] px-3 text-[13px] text-[#E8D5B7] focus:border-[#C8924A]/50 focus:outline-none transition-colors appearance-none cursor-pointer";

const labelCls = "block text-[12px] font-semibold uppercase tracking-wider text-[#5A4232]";

const sectionCls =
  "rounded-[16px] border border-[#2E231A] bg-[#1C1611] overflow-hidden";

const sectionHeaderCls =
  "flex items-center gap-2.5 border-b border-[#2E231A] px-6 py-4";

const sectionBodyCls = "space-y-4 px-6 py-5";

const addBtnCls =
  "inline-flex items-center gap-1.5 rounded-[9px] border border-[#3D2E1E] bg-[#2E231A] px-3 h-8 text-[12px] text-[#7A6045] hover:text-[#C8924A] hover:border-[#C8924A]/30 transition-all";

const removeBtnCls =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-[#5A4232] hover:bg-red-400/10 hover:text-red-400 transition-all";

/* ── component ────────────────────────────────────────────── */

export function ShowroomForm({
  mode,
  initialData,
  isSubmitting = false,
  onSubmit,
}: ShowroomFormProps) {
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

  const heading = mode === "create" ? "Create Showroom" : "Edit Showroom";
  const subtitle =
    mode === "create"
      ? "Add a new showroom location with all its details."
      : "Update this showroom's information and display content.";
  const submitLabel = mode === "create" ? "Create showroom" : "Save changes";

  const updateField = (key: keyof ShowroomFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /* ── upload ──────────────────────────────────────────── */

  const handleUpload = async (file?: File) => {
    if (!file) return;

    try {
      setIsUploading(true);
      setError("");

      const presignResponse = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": file.type || "application/octet-stream" },
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

  /* ── submit ──────────────────────────────────────────── */

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
      coordinates: { lat, lng },
      image: form.image.trim() || undefined,
      imageMediaId: form.imageMediaId.trim() || undefined,
      openToday: form.openToday.trim() || undefined,
      facilities: splitCsv(form.facilitiesText),
      nearbyStores: splitCsv(form.nearbyStoresText),
      team: form.team.filter((member) => member.name.trim() && member.role.trim()),
      displayProducts: form.displayProducts.filter((entry) => entry.productId.trim()),
      openingHours: form.openingHours.filter((hour) => hour.day.trim() && hour.hours.trim()),
    };

    try {
      await onSubmit(payload);
    } catch (submitError: any) {
      setError(submitError?.message || "Failed to save showroom");
    }
  };

  /* ── render ──────────────────────────────────────────── */

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/showrooms"
            className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#2E231A] bg-[#1C1611] text-[#5A4232] transition-all hover:border-[#C8924A]/30 hover:text-[#C8924A]"
          >
            <ArrowLeft size={15} />
          </Link>
          <div>
            <h1 className="text-[20px] font-bold text-[#E8D5B7]">{heading}</h1>
            <p className="text-[12.5px] text-[#5A4232]">{subtitle}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* ── 1. Basic Details ── */}
        <section className={sectionCls}>
          <div className={sectionHeaderCls}>
            <Store size={15} className="text-[#C8924A]" />
            <h2 className="text-[13px] font-semibold text-[#E8D5B7]">Basic Details</h2>
          </div>
          <div className={sectionBodyCls}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <span className={labelCls}>Showroom Name</span>
                <input
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  required
                  placeholder="e.g. London Flagship"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <span className={labelCls}>URL Slug</span>
                <input
                  value={form.slug}
                  onChange={(e) => updateField("slug", e.target.value)}
                  required
                  placeholder="e.g. london-flagship"
                  className={`${inputCls} font-mono text-[12px]`}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <span className={labelCls}>
                  <span className="inline-flex items-center gap-1.5">
                    <Phone size={11} /> Phone
                  </span>
                </span>
                <input
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  required
                  placeholder="+44 20 1234 5678"
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <span className={labelCls}>
                  <span className="inline-flex items-center gap-1.5">
                    <Mail size={11} /> Email
                  </span>
                </span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  required
                  placeholder="showroom@lomashwood.co.uk"
                  className={inputCls}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <span className={labelCls}>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={11} /> Open Today
                </span>
              </span>
              <input
                value={form.openToday}
                onChange={(e) => updateField("openToday", e.target.value)}
                placeholder="e.g. 9:00 AM - 6:00 PM"
                className={inputCls}
              />
            </div>
          </div>
        </section>

        {/* ── 2. Location ── */}
        <section className={sectionCls}>
          <div className={sectionHeaderCls}>
            <MapPin size={15} className="text-[#C8924A]" />
            <h2 className="text-[13px] font-semibold text-[#E8D5B7]">Location</h2>
          </div>
          <div className={sectionBodyCls}>
            <AddressMapPicker
              initialAddress={form.address}
              initialLatitude={form.latitude ? Number(form.latitude) : undefined}
              initialLongitude={form.longitude ? Number(form.longitude) : undefined}
              initialCity={form.city}
              initialPostcode={form.postcode}
              onAddressSelect={(data) => {
                setForm((prev) => ({
                  ...prev,
                  address: data.address,
                  city: data.city,
                  postcode: data.postcode,
                  latitude: String(data.latitude),
                  longitude: String(data.longitude),
                }));
              }}
            />

            {/* Selected address summary */}
            {form.address && (
              <div className="flex flex-wrap items-center gap-2 rounded-[9px] border border-[#2E231A] bg-[#1A100C] px-4 py-3">
                <MapPin size={13} className="shrink-0 text-[#C8924A]" />
                <span className="text-[12.5px] text-[#C8B99A]">{form.address}</span>
                {form.city && (
                  <span className="rounded-full bg-[#2E231A] px-2 py-0.5 text-[10.5px] font-medium text-[#7A6045]">
                    {form.city}
                  </span>
                )}
                {form.postcode && (
                  <span className="rounded-full bg-[#2E231A] px-2 py-0.5 text-[10.5px] font-medium text-[#7A6045]">
                    {form.postcode}
                  </span>
                )}
              </div>
            )}

            {/* Manual override */}
            <details className="group">
              <summary className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-[#3D2E1E] transition-colors hover:text-[#C8924A]">
                <GripVertical size={11} className="rotate-90" />
                Manual address override
              </summary>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <span className={labelCls}>City</span>
                  <input
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    placeholder="London"
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <span className={labelCls}>Postcode</span>
                  <input
                    value={form.postcode}
                    onChange={(e) => updateField("postcode", e.target.value)}
                    placeholder="SW1A 1AA"
                    className={inputCls}
                  />
                </div>
                <div className="space-y-1.5">
                  <span className={labelCls}>Latitude</span>
                  <input
                    value={form.latitude}
                    onChange={(e) => updateField("latitude", e.target.value)}
                    placeholder="51.5074"
                    className={`${inputCls} font-mono text-[12px]`}
                  />
                </div>
                <div className="space-y-1.5">
                  <span className={labelCls}>Longitude</span>
                  <input
                    value={form.longitude}
                    onChange={(e) => updateField("longitude", e.target.value)}
                    placeholder="-0.1278"
                    className={`${inputCls} font-mono text-[12px]`}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <span className={labelCls}>Full Address</span>
                  <textarea
                    value={form.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="Full street address"
                    rows={2}
                    className={textareaCls}
                  />
                </div>
              </div>
            </details>
          </div>
        </section>

        {/* ── 3. Showroom Image ── */}
        <section className={sectionCls}>
          <div className={sectionHeaderCls}>
            <ImageIcon size={15} className="text-[#C8924A]" />
            <h2 className="text-[13px] font-semibold text-[#E8D5B7]">Showroom Image</h2>
          </div>
          <div className={sectionBodyCls}>
            {form.image ? (
              <div className="group relative overflow-hidden rounded-[12px] border border-[#2E231A]">
                <Image
                  src={form.image}
                  alt="Showroom preview"
                  width={800}
                  height={400}
                  className="h-[200px] w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <label className="flex h-9 cursor-pointer items-center gap-2 rounded-[9px] bg-[#C8924A] px-4 text-[12.5px] font-medium text-white transition-colors hover:bg-[#B87E3E]">
                    <Upload size={13} />
                    Replace
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
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, image: "", imageMediaId: "" }))}
                    className="flex h-9 items-center gap-2 rounded-[9px] bg-red-500/20 px-4 text-[12.5px] font-medium text-red-400 transition-colors hover:bg-red-500/30"
                  >
                    <X size={13} />
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[12px] border-2 border-dashed border-[#2E231A] bg-[#1A100C] py-10 transition-all hover:border-[#C8924A]/30 hover:bg-[#221A12]">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2E231A]">
                  <Upload size={18} className="text-[#5A4232]" />
                </div>
                <div className="text-center">
                  <p className="text-[13px] font-medium text-[#C8B99A]">
                    {isUploading ? "Uploading..." : "Click to upload showroom image"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#3D2E1E]">JPG, PNG or WebP. Max 5MB.</p>
                </div>
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
            )}
            <div className="space-y-1.5">
              <span className={labelCls}>Or paste image URL</span>
              <input
                value={form.image}
                onChange={(e) => updateField("image", e.target.value)}
                placeholder="https://..."
                className={`${inputCls} font-mono text-[12px]`}
              />
            </div>
          </div>
        </section>

        {/* ── 4. Facilities & Nearby Stores ── */}
        <section className={sectionCls}>
          <div className={sectionHeaderCls}>
            <Building2 size={15} className="text-[#C8924A]" />
            <h2 className="text-[13px] font-semibold text-[#E8D5B7]">
              Facilities & Nearby Stores
            </h2>
          </div>
          <div className={sectionBodyCls}>
            <div className="space-y-1.5">
              <span className={labelCls}>Facilities</span>
              <textarea
                value={form.facilitiesText}
                onChange={(e) => updateField("facilitiesText", e.target.value)}
                rows={3}
                placeholder="Parking, Wheelchair access, Cafe, Design consultation..."
                className={textareaCls}
              />
              <p className="text-[10.5px] text-[#3D2E1E]">Separate each facility with a comma</p>
            </div>
            <div className="space-y-1.5">
              <span className={labelCls}>Nearby Stores</span>
              <textarea
                value={form.nearbyStoresText}
                onChange={(e) => updateField("nearbyStoresText", e.target.value)}
                rows={2}
                placeholder="manchester-showroom, birmingham-showroom..."
                className={`${textareaCls} font-mono text-[12px]`}
              />
              <p className="text-[10.5px] text-[#3D2E1E]">
                Enter showroom slugs, separated by commas
              </p>
            </div>
          </div>
        </section>

        {/* ── 5. Team Members ── */}
        <section className={sectionCls}>
          <div className={sectionHeaderCls}>
            <Users size={15} className="text-[#C8924A]" />
            <h2 className="text-[13px] font-semibold text-[#E8D5B7]">Team Members</h2>
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({ ...prev, team: [...prev.team, { name: "", role: "" }] }))
              }
              className={`${addBtnCls} ml-auto`}
            >
              <Plus size={13} /> Add member
            </button>
          </div>
          <div className={sectionBodyCls}>
            {form.team.length === 0 && (
              <p className="py-4 text-center text-[12.5px] text-[#3D2E1E]">
                No team members added yet.
              </p>
            )}
            <div className="space-y-3">
              {form.team.map((member, idx) => (
                <div
                  key={`team-${idx}`}
                  className="flex items-center gap-3 rounded-[10px] border border-[#2E231A] bg-[#1A100C] p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2E231A] text-[11px] font-bold text-[#5A4232]">
                    {idx + 1}
                  </div>
                  <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
                    <input
                      value={member.name}
                      onChange={(e) => {
                        const next = [...form.team];
                        const current = next[idx] || { name: "", role: "" };
                        next[idx] = { ...current, name: e.target.value };
                        setForm((prev) => ({ ...prev, team: next }));
                      }}
                      placeholder="Full name"
                      className={inputCls}
                    />
                    <input
                      value={member.role}
                      onChange={(e) => {
                        const next = [...form.team];
                        const current = next[idx] || { name: "", role: "" };
                        next[idx] = { ...current, role: e.target.value };
                        setForm((prev) => ({ ...prev, team: next }));
                      }}
                      placeholder="Role / title"
                      className={inputCls}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        team: prev.team.filter((_, i) => i !== idx),
                      }))
                    }
                    className={removeBtnCls}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6. Kitchens & Bedrooms on Display ── */}
        <section className={sectionCls}>
          <div className={sectionHeaderCls}>
            <ShoppingBag size={15} className="text-[#C8924A]" />
            <h2 className="text-[13px] font-semibold text-[#E8D5B7]">
              Kitchens & Bedrooms on Display
            </h2>
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  displayProducts: [...prev.displayProducts, { productId: "", isPrimary: false }],
                }))
              }
              className={`${addBtnCls} ml-auto`}
            >
              <Plus size={13} /> Add product
            </button>
          </div>
          <div className={sectionBodyCls}>
            {form.displayProducts.length === 0 && (
              <p className="py-4 text-center text-[12.5px] text-[#3D2E1E]">
                No products added yet.
              </p>
            )}
            <div className="space-y-3">
              {form.displayProducts.map((entry, idx) => (
                <div
                  key={`display-${idx}`}
                  className="flex items-start gap-3 rounded-[10px] border border-[#2E231A] bg-[#1A100C] p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2E231A] text-[11px] font-bold text-[#5A4232]">
                    {idx + 1}
                  </div>
                  <div className="flex-1 space-y-2.5">
                    <select
                      value={entry.productId}
                      onChange={(e) => {
                        const next = [...form.displayProducts];
                        next[idx] = { ...next[idx], productId: e.target.value };
                        setForm((prev) => ({ ...prev, displayProducts: next }));
                      }}
                      className={selectCls}
                    >
                      <option value="">Select a product...</option>
                      {productOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.title} ({option.category})
                        </option>
                      ))}
                    </select>
                    <label className="inline-flex cursor-pointer items-center gap-2">
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
                        className="h-4 w-4 rounded border-[#3D2E1E] bg-[#2E231A] text-[#C8924A] focus:ring-[#C8924A]/30"
                      />
                      <span className="text-[12px] text-[#7A6045]">Primary display product</span>
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        displayProducts: prev.displayProducts.filter((_, i) => i !== idx),
                      }))
                    }
                    className={removeBtnCls}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7. Opening Hours ── */}
        <section className={sectionCls}>
          <div className={sectionHeaderCls}>
            <Clock size={15} className="text-[#C8924A]" />
            <h2 className="text-[13px] font-semibold text-[#E8D5B7]">Opening Hours</h2>
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  openingHours: [...prev.openingHours, { day: "", hours: "" }],
                }))
              }
              className={`${addBtnCls} ml-auto`}
            >
              <Plus size={13} /> Add hours
            </button>
          </div>
          <div className={sectionBodyCls}>
            {form.openingHours.length === 0 && (
              <p className="py-4 text-center text-[12.5px] text-[#3D2E1E]">
                No opening hours added yet.
              </p>
            )}
            <div className="space-y-3">
              {form.openingHours.map((hour, idx) => (
                <div
                  key={`hour-${idx}`}
                  className="flex items-center gap-3 rounded-[10px] border border-[#2E231A] bg-[#1A100C] p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2E231A] text-[11px] font-bold text-[#5A4232]">
                    {idx + 1}
                  </div>
                  <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
                    <input
                      value={hour.day}
                      onChange={(e) => {
                        const next = [...form.openingHours];
                        const current = next[idx] || { day: "", hours: "" };
                        next[idx] = { ...current, day: e.target.value };
                        setForm((prev) => ({ ...prev, openingHours: next }));
                      }}
                      placeholder="e.g. Monday - Friday"
                      className={inputCls}
                    />
                    <input
                      value={hour.hours}
                      onChange={(e) => {
                        const next = [...form.openingHours];
                        const current = next[idx] || { day: "", hours: "" };
                        next[idx] = { ...current, hours: e.target.value };
                        setForm((prev) => ({ ...prev, openingHours: next }));
                      }}
                      placeholder="e.g. 9:00 AM - 6:00 PM"
                      className={inputCls}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        openingHours: prev.openingHours.filter((_, i) => i !== idx),
                      }))
                    }
                    className={removeBtnCls}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Error & Submit ── */}
        {error && (
          <div className="flex items-center gap-2.5 rounded-[10px] border border-red-400/20 bg-red-400/10 px-4 py-3">
            <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
            <p className="text-[12.5px] text-red-400">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-3 border-t border-[#2E231A] pt-5">
          <Link
            href="/showrooms"
            className="flex h-10 items-center rounded-[9px] px-5 text-[13px] font-medium text-[#5A4232] transition-colors hover:bg-[#2E231A] hover:text-[#E8D5B7]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="flex h-10 items-center gap-2 rounded-[9px] bg-[#C8924A] px-6 text-[13px] font-medium text-white transition-colors hover:bg-[#B87E3E] disabled:pointer-events-none disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving...
              </>
            ) : (
              submitLabel
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
