"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { BlogEditor } from "@/components/content/BlogEditor";

export default function NewBlogPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New Blog Post"
        description="Create a new blog post or inspiration article."
        backHref="/content/blogs"
      />
      <BlogEditor />
    </div>
  );
}