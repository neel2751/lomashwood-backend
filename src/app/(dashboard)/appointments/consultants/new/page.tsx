"use client";

import { ConsultantForm } from "@/components/appointments/ConsultantForm";
import { PageHeader } from "@/components/layout/PageHeader";

export default function NewConsultantPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Add New Consultant"
        description="Create a new consultant for appointment scheduling."
        backHref="/appointments/consultants"
      />
      <ConsultantForm />
    </div>
  );
}