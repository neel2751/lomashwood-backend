"use client";

import { CustomerTable } from "@/components/customers/CustomerTable";
import { PageHeader } from "@/components/layout/PageHeader";

export default function CustomersPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Customers"
        description="Manage and view all customer accounts."
      />
      <CustomerTable />
    </div>
  );
}