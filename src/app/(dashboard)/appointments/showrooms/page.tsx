"use client";

import Link from "next/link";

import { useShowrooms } from "@/hooks/useShowrooms";

export default function ShowroomsPage() {
  const { data, isLoading, isError } = useShowrooms({ page: 1, limit: 100 });

  const showrooms = ((data as { data?: Array<{ id: string; name: string; city: string; slug: string; postcode: string; phone: string; openToday?: string }> } | undefined)?.data ?? []);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Showrooms</h1>
          <p className="mt-1 text-sm text-gray-500">Manage showroom locations and opening details.</p>
        </div>
        <Link href="/appointments/showrooms/new" className="inline-flex h-10 items-center rounded-md bg-[#1A1A18] px-4 text-sm font-medium text-white">
          Add Showroom
        </Link>
      </div>

      {isLoading && <div className="rounded-lg border border-[#E8E6E1] bg-white p-6 text-sm text-gray-500">Loading showrooms...</div>}
      {isError && <div className="rounded-lg border border-[#E8E6E1] bg-white p-6 text-sm text-red-600">Failed to load showrooms.</div>}

      {!isLoading && !isError && (
        <div className="overflow-hidden rounded-lg border border-[#E8E6E1] bg-white">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-[#FAFAF8] text-xs uppercase tracking-wide text-[#6B6B68]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Postcode</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Open Today</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {showrooms.map((showroom) => (
                <tr key={showroom.id} className="border-t border-[#F0EDE8]">
                  <td className="px-4 py-3 font-medium text-[#1A1A18]">{showroom.name}</td>
                  <td className="px-4 py-3 text-[#6B6B68]">{showroom.city}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#6B6B68]">{showroom.slug}</td>
                  <td className="px-4 py-3 text-[#6B6B68]">{showroom.postcode}</td>
                  <td className="px-4 py-3 text-[#6B6B68]">{showroom.phone}</td>
                  <td className="px-4 py-3 text-[#6B6B68]">{showroom.openToday ?? "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/appointments/showrooms/${showroom.id}`} className="text-sm font-medium text-[#8B6914] hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
              {showrooms.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-[#6B6B68]" colSpan={7}>
                    No showrooms found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
