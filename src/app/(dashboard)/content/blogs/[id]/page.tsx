"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { BlogEditor } from "@/components/content/BlogEditor";

export default function BlogDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit Blog Post"
        description="Update this blog post or inspiration article."
        backHref="/content/blogs"
      />
      <BlogEditor id={id} />
    </div>
  );
}