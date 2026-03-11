"use client";

import { useMemo, useState } from "react";

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

  const options = (query.data?.data ?? []) as ProductOption[];

  const filtered = useMemo(() => {
    return options.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.description ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? item.isActive : !item.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [options, search, statusFilter]);

  const isEditing = Boolean(form.id);
  const isSaving = createOption.isPending || updateOption.isPending;

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
    <div className="rounded-[16px] bg-white border border-[#E8E6E1] overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-[#E8E6E1] bg-[#FCFBF9]">
        <h2 className="text-[15px] font-semibold text-[#1A1A18]">{title}</h2>
        <p className="text-[12px] text-[#7A776F] mt-1">Create, edit, delete, and manage active status.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3 border-b border-[#E8E6E1] bg-[#FFFEFC]">
        <input
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Name"
          className="h-10 px-3 rounded-[9px] bg-white border border-[#D9D5CD] text-[13px] text-[#2B2A28]"
        />
        <input
          value={form.image}
          onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
          placeholder="Image URL (optional)"
          className="h-10 px-3 rounded-[9px] bg-white border border-[#D9D5CD] text-[13px] text-[#2B2A28]"
        />
        <textarea
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Description (optional)"
          rows={3}
          className="md:col-span-2 px-3 py-2.5 rounded-[9px] bg-white border border-[#D9D5CD] text-[13px] text-[#2B2A28]"
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
            className={cn(
              "h-9 px-3 rounded-[8px] text-[12px] font-medium",
              form.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"
            )}
          >
            {form.isActive ? "Active" : "Inactive"}
          </button>

          {isEditing && (
            <button
              type="button"
              onClick={() => setForm(defaultForm)}
              className="h-9 px-3 rounded-[8px] bg-[#F2EEE6] text-[12px] text-[#6B6B68]"
            >
              Cancel edit
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isSaving || !form.name.trim()}
          className="h-9 px-4 rounded-[9px] bg-[#C8924A] text-white text-[12.5px] font-medium disabled:opacity-50 justify-self-start"
        >
          <span className="inline-flex items-center gap-2">
            <Plus size={14} /> {isEditing ? "Update" : "Add"}
          </span>
        </button>
      </form>

      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E8E6E1] bg-[#FCFBF9]">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8884]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="h-9 pl-8 pr-3 rounded-[9px] bg-white border border-[#D9D5CD] text-[12.5px] text-[#2B2A28] w-[220px]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
          className="h-9 px-3 rounded-[9px] bg-white border border-[#D9D5CD] text-[12.5px] text-[#2B2A28]"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-[#E8E6E1] bg-[#FCFBF9]">
            {[
              "Name",
              "Description",
              "Status",
              "Created",
              "",
            ].map((head) => (
              <th key={head} className="px-5 py-3 text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#7A776F]">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F0EEE9]">
          {query.isLoading ? (
            <tr>
              <td colSpan={5} className="px-5 py-8 text-center text-[#7A776F]">Loading...</td>
            </tr>
          ) : query.isError ? (
            <tr>
              <td colSpan={5} className="px-5 py-8 text-center text-red-400">Failed to load records.</td>
            </tr>
          ) : filtered.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-5 py-8 text-center text-[#7A776F]">No records found.</td>
            </tr>
          ) : (
            filtered.map((item) => (
              <tr key={item.id} className="group hover:bg-[#FAF7F1] transition-colors">
                <td className="px-5 py-3.5 text-[13px] text-[#2B2A28] font-medium">{item.name}</td>
                <td className="px-5 py-3.5 text-[12px] text-[#6B6B68] max-w-[360px] truncate">
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
                      "px-2 py-0.5 rounded-full text-[11px] font-medium",
                      item.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"
                    )}
                  >
                    {item.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-5 py-3.5 text-[11px] text-[#7A776F]">
                  {new Date(item.createdAt).toLocaleDateString("en-GB")}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#8A8884] hover:text-[#8B6914] hover:bg-[#F3EEE3]"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(item)}
                      disabled={deleteOption.isPending}
                      className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#8A8884] hover:text-red-600 hover:bg-red-50"
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
