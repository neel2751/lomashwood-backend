"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, MapPin, Plus } from "lucide-react";

import { useShowrooms } from "@/hooks/useShowrooms";
import type { Showroom } from "@/types/showroom.types";
import { ShowroomCard } from "./ShowroomCard";

export function ShowroomTable() {
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("All");

  const { data, isLoading, isError } = useShowrooms({
    page: 1,
    limit: 100,
    search: search || undefined,
  });

  const showrooms = ((data as { data?: Showroom[] } | undefined)?.data ?? []) as Showroom[];

  // Extract unique cities for filter
  const cities = ["All", ...Array.from(new Set(showrooms.map((s) => s.city)))];

  // Filter showrooms
  const filtered = showrooms.filter((showroom) => {
    const matchesCity = cityFilter === "All" || showroom.city === cityFilter;
    const matchesSearch =
      search === "" ||
      showroom.name.toLowerCase().includes(search.toLowerCase()) ||
      showroom.city.toLowerCase().includes(search.toLowerCase()) ||
      showroom.address.toLowerCase().includes(search.toLowerCase());
    return matchesCity && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden p-8">
        <p className="text-center text-[#5A4232]">Loading showrooms...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden p-8">
        <p className="text-center text-red-400">Failed to load showrooms.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F1E8] mb-1">Showrooms</h1>
          <p className="text-sm text-[#8F7553]">
            {filtered.length} {filtered.length === 1 ? "showroom" : "showrooms"}
          </p>
        </div>

        <Link href="/showrooms/new" className="px-4 py-2.5 rounded-[10px] bg-[#C8924A] hover:bg-[#B07F3F] text-white font-medium transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Showroom
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A4232]" />
            <input
              type="text"
              placeholder="Search by name, city, or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-[10px] bg-[#0F0A06] border border-[#2E231A] text-[#F5F1E8] placeholder:text-[#5A4232] focus:outline-none focus:border-[#C8924A]/50 transition-colors text-sm"
            />
          </div>

          {/* City Filter */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A4232] pointer-events-none" />
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="pl-9 pr-10 py-2.5 rounded-[10px] bg-[#0F0A06] border border-[#2E231A] text-[#F5F1E8] focus:outline-none focus:border-[#C8924A]/50 transition-colors text-sm appearance-none cursor-pointer min-w-[160px]"
            >
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Showrooms Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] p-12 text-center">
          <MapPin className="w-12 h-12 text-[#5A4232] mx-auto mb-3" />
          <p className="text-[#8F7553] mb-1">No showrooms found</p>
          <p className="text-sm text-[#5A4232]">
            {search || cityFilter !== "All"
              ? "Try adjusting your filters"
              : "Get started by adding your first showroom"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((showroom) => (
            <ShowroomCard key={showroom.id} showroom={showroom} />
          ))}
        </div>
      )}
    </div>
  );
}
