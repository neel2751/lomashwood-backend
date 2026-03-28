"use client";

import { useMemo, useRef, useState } from "react";

import { Pencil, Plus, Search, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

type ProductOption = {
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;
  isActive: boolean;
  createdAt: string;
};

type ProductOptionPayload = {
  name: string;
  description?: string;
  image?: string;
  isActive: boolean;
};

interface ProductOptionTableProps {
  title: string;
  query: {
    data?: { data?: ProductOption[] };
    isLoading: boolean;
    isError: boolean;
  };
  createOption: {
    mutateAsync: (payload: ProductOptionPayload) => Promise<unknown>;
    isPending: boolean;
  };
  updateOption: {
    mutateAsync: (args: { id: string; payload: ProductOptionPayload }) => Promise<unknown>;
    isPending: boolean;
  };
  deleteOption: {
    mutateAsync: (id: string) => Promise<unknown>;
    isPending: boolean;
  };
}

const defaultForm = {
  id: "",
  name: "",
  description: "",
  image: "",
  isActive: true,
};

export function ProductOptionTable({
  title,
  query,
  createOption,
  updateOption,
  deleteOption,
}: ProductOptionTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [form, setForm] = useState(defaultForm);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isImageDragging, setIsImageDragging] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  const options = (query.data?.data ?? []) as ProductOption[];

  const filtered = useMemo(() => {
    return options.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.description ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || (statusFilter === "active" ? item.isActive : !item.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [options, search, statusFilter]);

  const isEditing = Boolean(form.id);
  const isSaving = createOption.isPending || updateOption.isPending;

  async function handleImageUpload(file?: File) {
    if (!file || isUploadingImage || isSaving) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose a valid image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image must be 10MB or smaller.");
      return;
    }

    try {
      setUploadError(null);
      setIsUploadingImage(true);

      const presignResponse = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          folder: "product-options",
          source: "product-option-table",
        }),
      });

      if (!presignResponse.ok) {
        const message = await presignResponse.text();
        throw new Error(message || "Failed to prepare image upload");
      }

      const { uploadUrl, fileUrl } = (await presignResponse.json()) as {
        uploadUrl: string;
        fileUrl: string;
      };

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      setForm((prev) => ({ ...prev, image: fileUrl }));
    } catch (uploadErr) {
      setUploadError(uploadErr instanceof Error ? uploadErr.message : "Image upload failed");
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) return;

    const payload: ProductOptionPayload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      image: form.image.trim() || undefined,
      isActive: form.isActive,
    };

    if (form.id) {
      await updateOption.mutateAsync({ id: form.id, payload });
    } else {
      await createOption.mutateAsync(payload);
    }

    setForm(defaultForm);
    setUploadError(null);
  }

  function startEdit(item: ProductOption) {
    setForm({
      id: item.id,
      name: item.name,
      description: item.description ?? "",
      image: item.image ?? "",
      isActive: item.isActive,
    });
  }

  async function handleDelete(item: ProductOption) {
    if (!confirm(`Delete \"${item.name}\"?`)) return;
    await deleteOption.mutateAsync(item.id);

    if (form.id === item.id) {
      setForm(defaultForm);
    }
  }

  return (
    <div className="overflow-hidden rounded-[16px] border border-[#E8E6E1] bg-white shadow-sm">
      <div className="border-b border-[#E8E6E1] bg-[#FCFBF9] px-5 py-4">
        <h2 className="text-[15px] font-semibold text-[#1A1A18]">{title}</h2>
        <p className="mt-1 text-[12px] text-[#7A776F]">
          Create, edit, delete, and manage active status.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-3 border-b border-[#E8E6E1] bg-[#FFFEFC] p-5 md:grid-cols-2"
      >
        <input
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Name"
          className="h-10 rounded-[9px] border border-[#D9D5CD] bg-white px-3 text-[13px] text-[#2B2A28]"
        />
        <div className="space-y-2">
          <div
            role="button"
            tabIndex={0}
            onClick={() => imageFileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                imageFileInputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (!isSaving && !isUploadingImage) {
                setIsImageDragging(true);
              }
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsImageDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsImageDragging(false);
              if (isSaving || isUploadingImage) {
                return;
              }
              void handleImageUpload(e.dataTransfer.files?.[0]);
            }}
            className={cn(
              "flex min-h-[68px] cursor-pointer flex-col items-center justify-center rounded-[9px] border border-dashed px-3 text-center transition",
              isImageDragging
                ? "border-[#C8924A] bg-[#F7F1E5]"
                : "border-[#D9D5CD] bg-[#FCFBF9] hover:border-[#C8924A]/60",
            )}
            aria-label="Upload option image"
          >
            <p className="text-[12px] font-medium text-[#2B2A28]">
              {isUploadingImage ? "Uploading image..." : "Drag & drop image here"}
            </p>
            <p className="text-[11px] text-[#7A776F]">or click to upload (max 10MB)</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              value={form.image}
              onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
              placeholder="Image URL (optional)"
              className="h-10 flex-1 rounded-[9px] border border-[#D9D5CD] bg-white px-3 text-[13px] text-[#2B2A28]"
            />
            <input
              ref={imageFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                void handleImageUpload(e.target.files?.[0]);
                e.currentTarget.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => imageFileInputRef.current?.click()}
              disabled={isSaving || isUploadingImage}
              className="h-10 rounded-[9px] border border-[#D9D5CD] bg-white px-3 text-[12px] font-medium text-[#2B2A28] disabled:opacity-60"
            >
              {isUploadingImage ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
        <textarea
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Description (optional)"
          rows={3}
          className="rounded-[9px] border border-[#D9D5CD] bg-white px-3 py-2.5 text-[13px] text-[#2B2A28] md:col-span-2"
        />

        {uploadError ? (
          <div className="rounded-[9px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700 md:col-span-2">
            {uploadError}
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
            className={cn(
              "h-9 rounded-[8px] px-3 text-[12px] font-medium",
              form.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700",
            )}
          >
            {form.isActive ? "Active" : "Inactive"}
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={() => setForm(defaultForm)}
              className="h-9 rounded-[8px] bg-[#F2EEE6] px-3 text-[12px] text-[#6B6B68]"
            >
              Cancel edit
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isSaving || !form.name.trim()}
          className="h-9 justify-self-start rounded-[9px] bg-[#C8924A] px-4 text-[12.5px] font-medium text-white disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-2">
            <Plus size={14} /> {isEditing ? "Update" : "Add"}
          </span>
        </button>
      </form>

      <div className="flex items-center gap-3 border-b border-[#E8E6E1] bg-[#FCFBF9] px-5 py-4">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8884]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="h-9 w-[220px] rounded-[9px] border border-[#D9D5CD] bg-white pl-8 pr-3 text-[12.5px] text-[#2B2A28]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
          className="h-9 rounded-[9px] border border-[#D9D5CD] bg-white px-3 text-[12.5px] text-[#2B2A28]"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-[#E8E6E1] bg-[#FCFBF9]">
            {["Name", "Image", "Description", "Status", "Created", ""].map((head) => (
              <th
                key={head}
                className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7A776F]"
              >
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F0EEE9]">
          {query.isLoading ? (
            <tr>
              <td colSpan={6} className="px-5 py-8 text-center text-[#7A776F]">
                Loading...
              </td>
            </tr>
          ) : query.isError ? (
            <tr>
              <td colSpan={6} className="px-5 py-8 text-center text-red-400">
                Failed to load records.
              </td>
            </tr>
          ) : filtered.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-5 py-8 text-center text-[#7A776F]">
                No records found.
              </td>
            </tr>
          ) : (
            filtered.map((item) => (
              <tr key={item.id} className="group transition-colors hover:bg-[#FAF7F1]">
                <td className="px-5 py-3.5 text-[13px] font-medium text-[#2B2A28]">{item.name}</td>
                <td className="px-5 py-3.5">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={`${item.name} preview`}
                      className="h-9 w-9 rounded-[8px] border border-[#D9D5CD] bg-white object-cover"
                    />
                  ) : (
                    <span className="text-[12px] text-[#A39F96]">-</span>
                  )}
                </td>
                <td className="max-w-[360px] truncate px-5 py-3.5 text-[12px] text-[#6B6B68]">
                  {item.description || "-"}
                </td>
                <td className="px-5 py-3.5">
                  <button
                    type="button"
                    onClick={async () => {
                      await updateOption.mutateAsync({
                        id: item.id,
                        payload: {
                          name: item.name,
                          description: item.description ?? undefined,
                          image: item.image ?? undefined,
                          isActive: !item.isActive,
                        },
                      });
                    }}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      item.isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-700",
                    )}
                  >
                    {item.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-5 py-3.5 text-[11px] text-[#7A776F]">
                  {new Date(item.createdAt).toLocaleDateString("en-GB")}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#8A8884] hover:bg-[#F3EEE3] hover:text-[#8B6914]"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(item)}
                      disabled={deleteOption.isPending}
                      className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[#8A8884] hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
