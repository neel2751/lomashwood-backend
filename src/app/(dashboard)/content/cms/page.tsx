"use client";

import { CmsPageTable } from "@/components/content/CmsPageTable";
import { PageHeader } from "@/components/layout/PageHeader";

export default function CmsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="CMS Pages"
        description="Manage dynamic pages such as Finance, About Us, Our Process, and more."
        backHref="/content"
        actionLabel="New Page"
        actionHref="/content/cms/new"
      />
      <CmsPageTable />
    </div>
  );
}