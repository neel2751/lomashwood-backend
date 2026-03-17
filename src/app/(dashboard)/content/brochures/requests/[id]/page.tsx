"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";
import { useBrochureRequest } from "@/hooks/useBrochures";

import type { BrochureFormRequest } from "@/types/content.types";

export default function BrochureRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const requestId = typeof params?.id === "string" ? params.id : "";

  const requestQuery = useBrochureRequest(requestId);
  const request = (requestQuery.data ?? null) as BrochureFormRequest | null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Brochure Request"
        description="View submitted brochure enquiry details."
        backHref="/content/brochures/requests"
        backLabel="Brochure Requests"
      />

      {requestQuery.isLoading ? (
        <div className="rounded-[16px] border border-[#E8E6E1] bg-white p-6 text-[13px] text-[#7A776F]">
          Loading request...
        </div>
      ) : requestQuery.isError || !request ? (
        <div className="rounded-[16px] border border-[#E8E6E1] bg-white p-6 text-[13px] text-red-600">
          Failed to load request.{" "}
          <Link href="/content/brochures/requests" className="underline">
            Go back
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="rounded-[16px] border border-[#E8E6E1] bg-white p-5">
            <h2 className="mb-3 text-[14px] font-semibold text-[#1A1A18]">Customer</h2>
            <div className="space-y-2 text-[13px] text-[#1A1A18]">
              <p>
                <span className="text-[#7A776F]">Name:</span> {request.firstName} {request.lastName}
              </p>
              <p>
                <span className="text-[#7A776F]">Email:</span> {request.email}
              </p>
              <p>
                <span className="text-[#7A776F]">Phone:</span> {request.phone}
              </p>
              <p>
                <span className="text-[#7A776F]">Postcode:</span> {request.postcode}
              </p>
              <p>
                <span className="text-[#7A776F]">Address:</span> {request.address}
              </p>
            </div>
          </section>

          <section className="rounded-[16px] border border-[#E8E6E1] bg-white p-5">
            <h2 className="mb-3 text-[14px] font-semibold text-[#1A1A18]">Request Details</h2>
            <div className="space-y-2 text-[13px] text-[#1A1A18]">
              <p>
                <span className="text-[#7A776F]">Delivery:</span>{" "}
                <span className="capitalize">{request.deliveryMethod}</span>
              </p>
              <p>
                <span className="text-[#7A776F]">Marketing Opt-in:</span>{" "}
                {request.marketingOptIn ? "Yes" : "No"}
              </p>
              <p>
                <span className="text-[#7A776F]">Created:</span>{" "}
                {new Date(request.createdAt).toLocaleString()}
              </p>
              {request.notes ? (
                <p>
                  <span className="text-[#7A776F]">Notes:</span> {request.notes}
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-[16px] border border-[#E8E6E1] bg-white p-5 lg:col-span-2">
            <h2 className="mb-3 text-[14px] font-semibold text-[#1A1A18]">Selected Brochures</h2>
            <div className="space-y-2">
              {((request.brochures?.length ? request.brochures : undefined) || []).map(
                (brochure) => (
                  <div
                    key={brochure.id}
                    className="flex items-center justify-between rounded-[10px] border border-[#EEEAE1] px-3 py-2 text-[13px]"
                  >
                    <div>
                      <p className="font-medium text-[#1A1A18]">{brochure.title}</p>
                      <p className="text-[11px] text-[#7A776F]">/{brochure.slug}</p>
                    </div>
                    <a
                      href={brochure.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[12px] font-medium text-[#8B6914] hover:underline"
                    >
                      Open PDF
                    </a>
                  </div>
                ),
              )}

              {(!request.brochures || request.brochures.length === 0) && (
                <p className="text-[13px] text-[#7A776F]">
                  {request.brochureTitles?.join(", ") || "No brochures selected."}
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
