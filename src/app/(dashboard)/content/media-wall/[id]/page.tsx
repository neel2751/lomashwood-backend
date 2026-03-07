"use client";



import { MediaUploader } from "@/components/content/MediaUploader";
import { PageHeader } from "@/components/layout/PageHeader";

export default function MediaWallDetailPage() {
 

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit Media Wall Item"
        description="Update this media wall entry."
        backHref="/content/media-wall"
      />
      <MediaUploader />
    </div>
  );
}
export const dynamic = 'force-dynamic'
