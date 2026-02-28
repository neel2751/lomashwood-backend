"use client";

import { useState } from "react";

import Link from "next/link";

import {
  Star, CheckCircle, XCircle, Flag, MessageSquare,
  ThumbsUp, ShieldCheck, ExternalLink, ChevronDown, Send,
} from "lucide-react";

import { cn } from "@/lib/utils";

type ReviewStatus = "pending" | "approved" | "rejected" | "flagged";

interface ReviewModerationCardProps {
  review?: {
    id: string;
    customer: string;
    customerId: string;
    customerEmail: string;
    product: string;
    productId: string;
    rating: number;
    title: string;
    body: string;
    status: ReviewStatus;
    verified: boolean;
    submittedAt: string;
    helpful: number;
    adminReply?: string;
  };
  onStatusChange?: (id: string, status: ReviewStatus) => void;
}

const MOCK_REVIEW = {
  id: "3",
  customer:      "Sarah Mitchell",
  customerId:    "8",
  customerEmail: "sarah.m@email.com",
  product:       "Slate Grey Gloss Kitchen",
  productId:     "3",
  rating:        2,
  title:         "Disappointed with finish",
  body:          "The doors had minor scratches on delivery. Customer service was slow to respond to my initial complaint — it took over three days to hear back. Eventually the issue was resolved but it took nearly three weeks total. The product itself, once replaced, looks great. But the process was very frustrating and stressful. I hope Lomash Wood can improve their customer support response times.",
  status:        "pending" as ReviewStatus,
  verified:      true,
  submittedAt:   "28 Feb 2026, 10:42",
  helpful:       0,
  adminReply:    "",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={16}
          className={i < rating ? "text-[#C8924A] fill-[#C8924A]" : "text-[#3D2E1E]"} />
      ))}
      <span className="ml-1 text-[14px] font-semibold text-[#E8D5B7]">{rating}.0</span>
    </div>
  );
}

const STATUS_CONFIG: Record<ReviewStatus, { label: string; bg: string; text: string }> = {
  pending:  { label: "Pending Moderation", bg: "bg-[#C8924A]/15", text: "text-[#C8924A]" },
  approved: { label: "Approved",           bg: "bg-emerald-400/10", text: "text-emerald-400" },
  rejected: { label: "Rejected",           bg: "bg-[#3D2E1E]",      text: "text-[#5A4232]"  },
  flagged:  { label: "Flagged",            bg: "bg-red-400/10",     text: "text-red-400"    },
};

const REPLY_TEMPLATES = [
  "Thank you for your feedback. We're sorry to hear about your experience and would love to make this right.",
  "We appreciate you taking the time to leave a review. Our team has noted your comments and we'll use them to improve.",
  "Thank you for your kind words! We're delighted you're happy with your Lomash Wood installation.",
  "We're sorry for the inconvenience caused. Please contact us directly at support@lomashwood.co.uk so we can help.",
];

export function ReviewModerationCard({
  review = MOCK_REVIEW,
  onStatusChange,
}: ReviewModerationCardProps) {
  const [status, setStatus]       = useState<ReviewStatus>(review.status);
  const [reply, setReply]         = useState(review.adminReply ?? "");
  const [showReply, setShowReply] = useState(false);
  const [replySent, setReplySent] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const updateStatus = (s: ReviewStatus) => {
    setStatus(s);
    onStatusChange?.(review.id, s);
  };

  const sendReply = () => {
    if (!reply.trim()) return;
    setReplySent(true);
    setShowReply(false);
    setTimeout(() => setReplySent(false), 3000);
  };

  const st = STATUS_CONFIG[status];

  return (
    <div className="rounded-[16px] bg-[#1C1611] border border-[#2E231A] overflow-hidden max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#2E231A] bg-[#1A100C]">
        <span className={cn("text-[11px] px-2.5 py-1 rounded-full font-medium", st.bg, st.text)}>
          {st.label}
        </span>
        <span className="text-[11px] text-[#3D2E1E]">{review.submittedAt}</span>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* Customer + product */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C8924A] to-[#6B4A20] flex items-center justify-center text-white text-[13px] font-bold shrink-0">
              {review.customer.split(" ").map((n) => n[0]).join("")}
            </div>
            <div>
              <Link href={`/customers/${review.customerId}`}
                className="text-[13px] font-medium text-[#C8B99A] hover:text-[#E8D5B7] transition-colors flex items-center gap-1.5">
                {review.customer}
                <ExternalLink size={11} className="text-[#5A4232]" />
              </Link>
              <p className="text-[11px] text-[#5A4232]">{review.customerEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {review.verified && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                <ShieldCheck size={11} /> Verified Purchase
              </span>
            )}
            <span className="flex items-center gap-1 text-[11px] text-[#5A4232]">
              <ThumbsUp size={11} /> {review.helpful} helpful
            </span>
          </div>
        </div>

        {/* Product link */}
        <Link href={`/products/${review.productId}`}
          className="flex items-center gap-1.5 text-[12px] text-[#7A6045] hover:text-[#C8924A] transition-colors w-fit">
          <ExternalLink size={11} />
          {review.product}
        </Link>

        {/* Rating */}
        <StarRating rating={review.rating} />

        {/* Review content */}
        <div className="rounded-[12px] bg-[#2E231A] border border-[#3D2E1E] p-4">
          <h4 className="text-[14px] font-semibold text-[#E8D5B7] mb-2">"{review.title}"</h4>
          <p className="text-[13px] text-[#7A6045] leading-relaxed">{review.body}</p>
        </div>

        {/* Admin reply */}
        {replySent && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-[9px] bg-emerald-400/10 border border-emerald-400/20 text-[12px] text-emerald-400">
            <CheckCircle size={13} /> Reply sent successfully
          </div>
        )}

        {showReply && (
          <div className="flex flex-col gap-3">
            {/* Templates */}
            <div>
              <button onClick={() => setShowTemplates((v) => !v)}
                className="flex items-center gap-1.5 text-[11.5px] text-[#5A4232] hover:text-[#C8924A] transition-colors mb-2">
                Use template <ChevronDown size={11} className={cn("transition-transform", showTemplates && "rotate-180")} />
              </button>
              {showTemplates && (
                <div className="rounded-[8px] border border-[#3D2E1E] overflow-hidden divide-y divide-[#3D2E1E]">
                  {REPLY_TEMPLATES.map((tpl, i) => (
                    <button key={i} onClick={() => { setReply(tpl); setShowTemplates(false); }}
                      className="w-full text-left px-3 py-2 text-[11.5px] text-[#5A4232] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all line-clamp-2">
                      {tpl}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <textarea value={reply} onChange={(e) => setReply(e.target.value)}
              rows={4}
              placeholder="Write a public reply to this review…"
              className="w-full px-3 py-2.5 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[13px] text-[#E8D5B7] placeholder:text-[#3D2E1E] focus:outline-none focus:border-[#C8924A]/50 transition-colors resize-none" />
            <div className="flex items-center gap-2">
              <button onClick={sendReply} disabled={!reply.trim()}
                className="flex items-center gap-2 h-9 px-4 rounded-[9px] bg-[#C8924A] text-white text-[12.5px] font-medium hover:bg-[#B87E3E] disabled:opacity-50 disabled:pointer-events-none transition-all">
                <Send size={13} /> Send Reply
              </button>
              <button onClick={() => { setShowReply(false); setReply(""); }}
                className="h-9 px-3 text-[12px] text-[#5A4232] hover:text-[#C8924A] transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 border-t border-[#2E231A] flex-wrap">
          {status !== "approved" && (
            <button onClick={() => updateStatus("approved")}
              className="flex items-center gap-2 h-9 px-4 rounded-[9px] bg-emerald-400/15 text-emerald-400 text-[12.5px] font-medium hover:bg-emerald-400/25 transition-all">
              <CheckCircle size={13} /> Approve
            </button>
          )}
          {status !== "rejected" && (
            <button onClick={() => updateStatus("rejected")}
              className="flex items-center gap-2 h-9 px-4 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[#5A4232] text-[12.5px] font-medium hover:text-red-400 hover:border-red-400/30 transition-all">
              <XCircle size={13} /> Reject
            </button>
          )}
          {status !== "flagged" && (
            <button onClick={() => updateStatus("flagged")}
              className="flex items-center gap-2 h-9 px-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[#5A4232] text-[12.5px] hover:text-amber-400 hover:border-amber-400/30 transition-all">
              <Flag size={13} /> Flag
            </button>
          )}
          {!showReply && !replySent && (
            <button onClick={() => setShowReply(true)}
              className="flex items-center gap-2 h-9 px-3 rounded-[9px] bg-[#2E231A] border border-[#3D2E1E] text-[#5A4232] text-[12.5px] hover:text-[#C8924A] hover:border-[#C8924A]/30 transition-all ml-auto">
              <MessageSquare size={13} /> Reply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}