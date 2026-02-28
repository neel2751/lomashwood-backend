"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { CmsPageEditor } from "@/components/content/CmsPageEditor";

export default function CmsDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit CMS Page"
        description="Update this dynamic content page."
        backHref="/content/cms"
      />
      <CmsPageEditor id={id} />
    </div>
  );
}