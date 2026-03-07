"use client";

import Link from "next/link";

import { BlogTable } from "@/components/content/BlogTable";
import { PageHeader } from "@/components/layout/PageHeader";

export default function BlogsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader
          title="Blogs"
          description="Manage all blog posts and inspiration articles."
          backHref="/content"
        />
        <Link href="/content/blogs/new" className="btn-primary">
          New Blog
        </Link>
      </div>
      <BlogTable />
    </div>
  );
}
export const dynamic = 'force-dynamic'
