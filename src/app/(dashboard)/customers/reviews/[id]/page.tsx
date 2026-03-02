"use client";

import { useParams } from "next/navigation";

import { ReviewModerationCard } from "@/components/customers/ReviewModerationCard";
import { PageHeader } from "@/components/layout/PageHeader";

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Review Detail"
        description="View and moderate this customer review."
        backHref="/customers/reviews"
      />
      <ReviewModerationCard
        review={{
          id,
          customer: "",
          customerId: "",
          customerEmail: "",
          product: "",
          productId: "",
          rating: 0,
          title: "",
          body: "",
          status: "pending",
          verified: false,
          submittedAt: "",
          helpful: 0,
          adminReply: "",
        }}
      />
    </div>
  );
}