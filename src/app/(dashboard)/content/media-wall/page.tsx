"use client";

import { MediaWallTable } from "@/components/content/MediaWallTable";
import { PageHeader } from "@/components/layout/PageHeader";

export default function MediaWallPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Media Wall"
        description="Manage media wall images and videos."
        backHref="/content"
      />
      <MediaWallTable />
    </div>
  );
}