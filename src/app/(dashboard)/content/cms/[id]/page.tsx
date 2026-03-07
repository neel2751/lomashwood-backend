"use client";



import { CmsPageEditor } from "@/components/content/CmsPageEditor";
import { PageHeader } from "@/components/layout/PageHeader";

export default function CmsDetailPage() {
  

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit CMS Page"
        description="Update this dynamic content page."
        backHref="/content/cms"
      />
      <CmsPageEditor />
    </div>
  );
}
export const dynamic = 'force-dynamic'
