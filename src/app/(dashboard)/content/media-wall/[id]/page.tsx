"use client";

import { useParams } from "next/navigation";

import { MediaUploader } from "@/components/content/MediaUploader";
import { PageHeader } from "@/components/layout/PageHeader";

export default function MediaWallDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit Media Wall Item"
        description="Update this media wall entry."
        backHref="/content/media-wall"
      />
      <MediaUploader id={id} />
    </div>
  );
}