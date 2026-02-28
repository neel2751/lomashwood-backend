"use client";

import { useState } from "react";

import Link from "next/link";

import {
  Search, Filter, ChevronDown, Star,
  CheckCircle, XCircle, Eye, Trash2, Flag,
} from "lucide-react";

import { cn } from "@/lib/utils";

type ReviewStatus = "pending" | "approved" | "rejected" | "flagged";

interface Review {
  id: string;
  customer: string;
  customerId: string;
  product: string;
  productId: string;
  rating: number;
  title: string;
  body: string;
  status: ReviewStatus;
  verified: boolean;
  submittedAt: string;
  helpful: number;
}

const MOCK_REVIEWS: Review[] = [
  { id: "1", customer: "James Thornton",  customerId: "1", product: "Luna White Kitchen",       productId: "1", rating: 5, title: "Exceptional quality",        body: "Absolutely stunning kitchen. The Luna White has transformed our home completely. Installation team were brilliant.",            status: "approved",  verified: true,  submittedAt: "15 Mar 2025", helpful: 12 },
  { id: "2", customer: "Oliver Patel",    customerId: "3", product: "Nordic Birch Bedroom",     productId: "4", rating: 5, title: "Beautiful craftsmanship",     body: "Superb finish and incredibly sturdy. Every detail is perfect. We're so happy with the result.",                            status: "approved",  verified: true,  submittedAt: "20 Apr 2025", helpful: 8  },
  { id: "3", customer: "Sarah Mitchell",  customerId: "8", product: "Slate Grey Gloss Kitchen", productId: "3", rating: 2, title: "Disappointed with finish",    body: "The doors had minor scratches on delivery. Customer service was slow to respond. Eventually resolved but took 3 weeks.",   status: "pending",   verified: true,  submittedAt: "28 Feb 2026", helpful: 0  },
  { id: "4", customer: "Priya Sharma",    customerId: "2", product: "Halo Oak Bedroom",         productId: "2", rating: 4, title: "Great product, minor delay",  body: "Love the look and feel. Only reason for 4 stars is the installation was delayed by a week. Product itself is 5 stars.",   status: "approved",  verified: true,  submittedAt: "10 Jan 2026", helpful: 5  },
  { id: "5", customer: "Unknown User",    customerId: "",  product: "Pebble J-Pull Kitchen",    productId: "5", rating: 1, title: "Terrible experience",         body: "Absolute rubbish. Never delivered. This company is a scam. Avoid at all costs!!!",                                         status: "flagged",   verified: false, submittedAt: "25 Feb 2026", helpful: 0  },
  { id: "6", customer: "Aisha Okoye",     customerId: "6", product: "Ash Handleless Kitchen",   productId: "6", rating: 5, title: "Worth every penny",           body: "We went for the handleless design and it's exactly what we dreamed of. Lomash Wood exceeded every expectation.",          status: "approved",  verified: true,  submittedAt: "05 Feb 2026", helpful: 14 },
  { id: "7", customer: "Tom Hendricks",   customerId: "7", product: "Halo Oak Bedroom",         productId: "2", rating: 3, title: "Mixed feelings",              body: "The design is beautiful but we had some issues with the fitting. One door hinge needed adjusting after install.",          status: "pending",   verified: true,  submittedAt: "27 Feb 2026", helpful: 0  },
];

const STATUS_CONFIG: Record<ReviewStatus, { label: string; bg: string; text: string }> = {
  pending:  { label: "Pending",  bg: "bg-[#C8924A]/15",    text: "text-[#C8924A]"  },
  approved: { label: "Approved", bg: "bg-emerald-400/10",  text: "text-emerald-400"},
  rejected: { label: "Rejected", bg: "bg-[#3D2E1E]",       text: "text-[#5A4232]"  },
  flagged:  { label: "Flagged",  bg: "bg-red-400/10",      text: "text-red-400"    },
};

function StarRating({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size}
          className={i < rating ? "text-[#C8924A] fill-[#C8924A]" : "text-[#3D2E1E]"} />
      ))}
    </div>
  );
}

export function ReviewTable() {
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatus]   = useState<"All" | ReviewStatus>("All");
  const [ratingFilter, setRating]   = useState<"All" | "5" | "4" | "3" | "2" | "1">("All");
  const [statuses, setStatuses]     = useState<Record<string, ReviewStatus>>(
    Object.fromEntries(MOCK_REVIEWS.map((r) => [r.id, r.status]))
  );

  const filtered = MOCK_REVIEWS.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      r.customer.toLowerCase().includes(q) ||
      r.product.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q);
    return (
      matchSearch &&
      (statusFilter === "All" || statuses[r.id] === statusFilter) &&
      (ratingFilter === "All" || r.rating === parseInt(ratingFilter))
    );
  });

  const pendingCount = MOCK_REVIEWS.filter((r) => statuses[r.id] === "pending").length;

  const approve = (id: string) => setStatuses((p) => ({ ...p, [id]: "approved" }));
  const reject  = (id: string) => setStatuses((p) => ({ ...p, [id]: "rejected" }));

  const avgRating = (MOCK_REVIEWS.reduce((s, r) => s + r.rating, 0) / MOCK_REVIEWS.length).toFixed(1);

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden">
      {/* Pending banner */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-2 px-5 py-2.5 bg-[#C8924A]/10 border-b border-[#C8924A]/20">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C8924A] animate-pulse" />
          <span className="text-[12px] text-[#C8924A]">
            {pendingCount} review{pendingCount !== 1 ? "s" : ""} awaiting moderation
          </span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2E231A] flex-wrap">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reviews…"
            className="h-9 pl-8 pr-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/40 w-[200px]" />
        </div>

        {/* Status filter */}
        <div className="relative">
          <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A4232]" />
          <select value={statusFilter} onChange={(e) => setStatus(e.target.value as any)}
            className="appearance-none h-9 pl-8 pr-7 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#9A7A5A] focus:outline-none focus:border-[#C8924A]/40">
            <option value="All">All Status</option>
            {(Object.keys(STATUS_CONFIG) as ReviewStatus[]).map((s) => (
              <option key={s} value={s} className="bg-[#1C1611]">{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
        </div>

        {/* Rating filter */}
        <div className="relative">
          <select value={ratingFilter} onChange={(e) => setRating(e.target.value as any)}
            className="appearance-none h-9 px-3 pr-7 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[12.5px] text-[#9A7A5A] focus:outline-none focus:border-[#C8924A]/40">
            <option value="All">All Ratings</option>
            {["5","4","3","2","1"].map((r) => (
              <option key={r} value={r} className="bg-[#1C1611]">{r} ★</option>
            ))}
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5A4232] pointer-events-none" />
        </div>

        <div className="ml-auto flex items-center gap-1.5 text-[12px] text-[#5A4232]">
          <Star size={13} className="text-[#C8924A] fill-[#C8924A]" />
          <span className="font-semibold text-[#E8D5B7]">{avgRating}</span>
          <span>avg from {MOCK_REVIEWS.length} reviews</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead>
            <tr className="border-b border-[#2E231A]">
              {["Customer","Product","Rating","Review","Verified","Status","Date",""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#3D2E1E]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E231A]">
            {filtered.map((review) => {
              const currentStatus = statuses[review.id] as ReviewStatus;
              const st = STATUS_CONFIG[currentStatus];
              return (
                <tr key={review.id} className="group hover:bg-[#221A12] transition-colors">
                  {/* Customer */}
                  <td className="px-4 py-3.5">
                    {review.customerId
                      ? <Link href={`/customers/${review.customerId}`} className="text-[12.5px] font-medium text-[#C8B99A] hover:text-[#E8D5B7] transition-colors">{review.customer}</Link>
                      : <span className="text-[12.5px] text-[#5A4232] italic">{review.customer}</span>
                    }
                  </td>

                  {/* Product */}
                  <td className="px-4 py-3.5">
                    <Link href={`/products/${review.productId}`} className="text-[12px] text-[#7A6045] hover:text-[#C8924A] transition-colors line-clamp-1">
                      {review.product}
                    </Link>
                  </td>

                  {/* Rating */}
                  <td className="px-4 py-3.5">
                    <StarRating rating={review.rating} />
                  </td>

                  {/* Review */}
                  <td className="px-4 py-3.5 max-w-[240px]">
                    <p className="text-[12.5px] font-medium text-[#C8B99A] leading-snug">{review.title}</p>
                    <p className="text-[11px] text-[#5A4232] mt-0.5 line-clamp-2 leading-snug">{review.body}</p>
                  </td>

                  {/* Verified */}
                  <td className="px-4 py-3.5">
                    {review.verified
                      ? <span className="flex items-center gap-1 text-[11px] text-emerald-400"><CheckCircle size={11} /> Verified</span>
                      : <span className="text-[11px] text-[#3D2E1E]">Unverified</span>
                    }
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <span className={cn("text-[10.5px] px-2 py-0.5 rounded-full font-medium", st.bg, st.text)}>
                      {st.label}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3.5">
                    <span className="text-[11px] text-[#5A4232] whitespace-nowrap">{review.submittedAt}</span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/customers/reviews/${review.id}`}
                        className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#5A4232] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all" title="View">
                        <Eye size={13} />
                      </Link>
                      {currentStatus === "pending" && (
                        <>
                          <button onClick={() => approve(review.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#5A4232] hover:text-emerald-400 hover:bg-emerald-400/10 transition-all" title="Approve">
                            <CheckCircle size={13} />
                          </button>
                          <button onClick={() => reject(review.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#5A4232] hover:text-red-400 hover:bg-red-400/10 transition-all" title="Reject">
                            <XCircle size={13} />
                          </button>
                        </>
                      )}
                      {currentStatus === "approved" && (
                        <button className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#5A4232] hover:text-amber-400 hover:bg-amber-400/10 transition-all" title="Flag">
                          <Flag size={13} />
                        </button>
                      )}
                      <button className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#5A4232] hover:text-red-400 hover:bg-red-400/10 transition-all" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-[#2E231A]">
        <span className="text-[12px] text-[#5A4232]">{filtered.length} reviews</span>
      </div>
    </div>
  );
}