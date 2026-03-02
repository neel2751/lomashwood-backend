"use client";

import Link from "next/link";
import { CmsPageTable } from "@/components/content/CmsPageTable";
import { PageHeader } from "@/components/layout/PageHeader";

export default function CmsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader
          title="CMS Pages"
          description="Manage dynamic pages such as Finance, About Us, Our Process, and more."
          backHref="/content"
        />
        <Link href="/content/cms/new" className="btn-primary">
          New Page
        </Link>
      </div>
      <CmsPageTable />
    </div>
  );
}