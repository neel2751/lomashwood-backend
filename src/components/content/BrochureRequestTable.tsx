"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { useBrochureRequests } from "@/hooks/useBrochures";

import type { BrochureFormRequest } from "@/types/content.types";

type BrochureRequestsResponse = {
  data: BrochureFormRequest[];
  total: number;
};

export function BrochureRequestTable() {
  const [search, setSearch] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"all" | "download" | "post">("all");

  const filters = useMemo(
    () => ({
      search: search || undefined,
      deliveryMethod: deliveryMethod === "all" ? undefined : deliveryMethod,
      page: 1,
      limit: 100,
    }),
    [search, deliveryMethod],
  );

  const { data, isLoading, isError } = useBrochureRequests(filters);
  const response = (data ?? { data: [], total: 0 }) as BrochureRequestsResponse;

  if (isLoading) {
    return (
      <div className="rounded-[16px] border border-[#E8E6E1] bg-white p-6 text-[13px] text-[#7A776F]">
        Loading brochure requests...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-[16px] border border-[#E8E6E1] bg-white p-6 text-[13px] text-red-600">
        Failed to load brochure requests.
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-[#E8E6E1] bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-[#E8E6E1] px-4 py-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, email, phone or postcode"
          className="h-9 min-w-[260px] rounded-[9px] border border-[#E8E6E1] px-3 text-[12.5px]"
        />

        <select
          value={deliveryMethod}
          onChange={(event) => setDeliveryMethod(event.target.value as "all" | "download" | "post")}
          className="h-9 rounded-[9px] border border-[#E8E6E1] px-3 text-[12.5px]"
        >
          <option value="all">All delivery methods</option>
          <option value="download">Download</option>
          <option value="post">Post</option>
        </select>

        <div className="ml-auto text-[12px] text-[#7A776F]">Total: {response.total}</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px]">
          <thead>
            <tr className="border-b border-[#E8E6E1] text-left text-[11px] text-[#7A776F]">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Address</th>
              <th className="px-4 py-3 font-medium">Delivery</th>
              <th className="px-4 py-3 font-medium">Marketing</th>
              <th className="px-4 py-3 font-medium">Selected Brochures</th>
              <th className="px-4 py-3 font-medium">Requested</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {response.data.map((request) => (
              <tr
                key={request.id}
                className="border-b border-[#F0EEE9] align-top text-[13px] text-[#1A1A18]"
              >
                <td className="px-4 py-3">
                  <div className="font-medium">
                    {request.firstName} {request.lastName}
                  </div>
                  {request.notes && (
                    <div className="mt-1 max-w-[260px] text-[11px] text-[#7A776F]">
                      {request.notes}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div>{request.email}</div>
                  <div className="text-[11px] text-[#7A776F]">{request.phone}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="max-w-[220px]">{request.address}</div>
                  <div className="text-[11px] text-[#7A776F]">{request.postcode}</div>
                </td>
                <td className="px-4 py-3 capitalize">{request.deliveryMethod}</td>
                <td className="px-4 py-3">{request.marketingOptIn ? "Yes" : "No"}</td>
                <td className="px-4 py-3">
                  <div className="max-w-[260px] text-[12px] text-[#1A1A18]">
                    {(request.brochureTitles?.length
                      ? request.brochureTitles
                      : request.brochures?.map((item) => item.title) || []
                    ).join(", ") || "-"}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[12px] text-[#7A776F]">
                  {new Date(request.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/content/brochures/requests/${request.id}`}
                    className="text-[12px] font-medium text-[#8B6914] hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}

            {response.data.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-[13px] text-[#7A776F]">
                  No brochure requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
