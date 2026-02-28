"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { CmsPageEditor } from "@/components/content/CmsPageEditor";

export default function NewCmsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New CMS Page"
        description="Create a new dynamic content page."
        backHref="/content/cms"
      />
      <CmsPageEditor />
    </div>
  );
}