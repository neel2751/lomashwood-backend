"use client";

import { BlogTable } from "@/components/content/BlogTable";
import { PageHeader } from "@/components/layout/PageHeader";

export default function BlogsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Blogs"
        description="Manage all blog posts and inspiration articles."
        backHref="/content"
        actionLabel="New Blog"
        actionHref="/content/blogs/new"
      />
      <BlogTable />
    </div>
  );
}