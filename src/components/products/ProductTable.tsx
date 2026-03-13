"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Search, Plus, Filter, MoreHorizontal,
  Pencil, Trash2, Eye, ChevronDown, Copy,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDeleteProduct, useProducts, useUpdateProduct } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Category = "kitchen" | "bedroom";
type ProductStatus = "active" | "draft" | "archived";

interface Product {
  id: string;
  title: string;
  category: Category;
  rangeName: string;
  colours: Array<{ id: string; name: string; hexCode: string }>;
  sizes: Array<{ id: string; title: string }>;
  price?: number;
  isPublished: boolean;
  isFeatured: boolean;
  isPopular: boolean;
  images: string[];
  updatedAt: string;
}

interface ProductTableProps {
  sizeFilter?: string;
}

const STATUS_STYLES: Record<ProductStatus, string> = {
  active:   "bg-emerald-100 text-emerald-700",
  draft:    "bg-sky-100 text-sky-700",
  archived: "bg-gray-100 text-gray-700",
};

export function ProductTable({ sizeFilter }: ProductTableProps) {
  const router = useRouter();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All" | Category>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | ProductStatus>("All");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const { data, isLoading, isError, error } = useProducts({
    page: 1,
    limit: 100,
    search: search || undefined,
    category: categoryFilter === "All" ? undefined : categoryFilter,
    isPublished:
      statusFilter === "All"
        ? undefined
        : statusFilter === "active"
          ? "true"
          : "false",
  });

  const products = ((data as { data?: Product[] } | undefined)?.data ?? []) as Product[];

  const filtered = products.filter((p) => {
    const matchSize = !sizeFilter || p.sizes.some((s) => s.id === sizeFilter);
    return matchSize;
  });

  const toggleSelect = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const toggleAll = () =>
    setSelected(selected.length === filtered.length ? [] : filtered.map((p) => p.id));

  async function togglePublished(product: Product) {
    try {
      await updateProduct.mutateAsync({
        id: product.id,
        payload: {
          isPublished: !product.isPublished,
        },
      });
      setOpenMenu(null);
    } catch {
      // Existing mutation layer handles cache invalidation; table error state is sufficient for now.
    }
  }

  async function handleDelete(productId: string) {
    try {
      await deleteProduct.mutateAsync(productId);
      toast.success("Product deleted");
      setOpenMenu(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete product";
      toast.error("Failed to delete product", message);
    }
  }

  function goToDuplicate(productId: string) {
    setOpenMenu(null);
    router.push(`/products/${productId}/duplicate`);
  }

  return (
    <div className="rounded-[16px] bg-white border border-[#E8E6E1] overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E8E6E1] flex-wrap bg-[#FCFBF9]">
        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8884]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="h-9 pl-8 pr-3 rounded-[9px] bg-white border border-[#D9D5CD] text-[12.5px] text-[#2B2A28] placeholder:text-[#A39F96] focus:outline-none focus:border-[#C8924A] w-[200px]"
          />
        </div>

        {/* Category filter */}
        <div className="relative">
          <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8884]" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as "All" | Category)}
            className="appearance-none h-9 pl-8 pr-7 rounded-[9px] bg-white border border-[#D9D5CD] text-[12.5px] text-[#2B2A28] focus:outline-none focus:border-[#C8924A]"
          >
            <option value="All">All Categories</option>
            <option value="kitchen">Kitchen</option>
            <option value="bedroom">Bedroom</option>
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A8884] pointer-events-none" />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "All" | ProductStatus)}
            className="appearance-none h-9 px-3 pr-7 rounded-[9px] bg-white border border-[#D9D5CD] text-[12.5px] text-[#2B2A28] focus:outline-none focus:border-[#C8924A]"
          >
            <option value="All">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A8884] pointer-events-none" />
        </div>

        {selected.length > 0 && (
          <span className="text-[11px] text-[#C8924A] bg-[#C8924A]/10 px-3 py-1 rounded-full">
            {selected.length} selected
          </span>
        )}

        <Link
          href="/products/new"
          className="ml-auto flex items-center gap-2 h-9 px-4 rounded-[9px] bg-[#C8924A] text-white text-[12.5px] font-medium hover:bg-[#B87E3E] transition-colors"
        >
          <Plus size={14} />
          Add Product
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-[#E8E6E1] bg-[#FCFBF9]">
              <th className="px-5 py-3 w-10">
                <input
                  type="checkbox"
                  checked={selected.length === filtered.length && filtered.length > 0}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded accent-[#C8924A] cursor-pointer"
                />
              </th>
              {["Product", "Category", "Colours", "Price", "Labels", "Images", "Status", "Updated", ""].map((h) => (
                <th key={h} className="px-3 py-3 text-left text-[10px] font-semibold tracking-[0.1em] uppercase text-[#7A776F]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EEE9]">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-[13px] text-[#7A776F]">
                  Loading products...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-[13px] text-red-400">
                  Failed to load products. {error instanceof Error ? error.message : 'Please try refreshing the page.'}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-[13px] text-[#7A776F]">
                  No products found{sizeFilter ? ` for this size` : ""}.
                </td>
              </tr>
            ) : (
              filtered.map((product) => (
                <tr key={product.id} className="group hover:bg-[#FAF7F1] transition-colors">
                  <td className="px-5 py-3.5">
                    <input
                      type="checkbox"
                      checked={selected.includes(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="w-4 h-4 rounded accent-[#C8924A] cursor-pointer"
                    />
                  </td>

                  {/* Product */}
                  <td className="px-3 py-3.5">
                    <div>
                      <Link
                        href={`/products/${product.id}`}
                        className="text-[13px] font-medium text-[#2B2A28] hover:text-[#8B6914] transition-colors"
                      >
                        {product.title}
                      </Link>
                      <p className="text-[11px] text-[#8A8884] mt-0.5">{product.rangeName} Range</p>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-3 py-3.5">
                    <span className={cn(
                      "text-[10.5px] px-2 py-0.5 rounded-full font-medium",
                      product.category === "kitchen"
                        ? "bg-[#C8924A]/15 text-[#C8924A]"
                        : "bg-[#6B8A9A]/15 text-[#6B8A9A]"
                    )}>
                      {product.category === "kitchen" ? "Kitchen" : "Bedroom"}
                    </span>
                  </td>

                  {/* Colours */}
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-1">
                      {product.colours.slice(0, 4).map((colour) => (
                        <span
                          key={colour.id}
                          className="w-4 h-4 rounded-full border border-[#D8D4CC] shrink-0"
                          style={{ background: colour.hexCode }}
                          title={colour.name}
                        />
                      ))}
                      {product.colours.length > 4 && (
                        <span className="text-[10px] text-[#8A8884]">+{product.colours.length - 4}</span>
                      )}
                    </div>
                  </td>

                  {/* Price */}
                  <td className="px-3 py-3.5">
                    <span className="text-[13px] font-semibold text-[#1A1A18]">
                      £{(product.price ?? 0).toLocaleString()}
                    </span>
                  </td>

                  {/* Labels */}
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {product.isFeatured ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                          Featured
                        </span>
                      ) : null}
                      {product.isPopular ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-rose-100 text-rose-700">
                          Popular
                        </span>
                      ) : null}
                      {!product.isFeatured && !product.isPopular ? (
                        <span className="text-[11px] text-[#8A8884]">-</span>
                      ) : null}
                    </div>
                  </td>

                  {/* Images */}
                  <td className="px-3 py-3.5">
                    <span className="text-[12px] text-[#6B6B68]">{product.images.length} imgs</span>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3.5">
                    <span
                      className={cn(
                        "text-[10.5px] px-2 py-0.5 rounded-full font-medium capitalize",
                        STATUS_STYLES[product.isPublished ? "active" : "draft"]
                      )}
                    >
                      {product.isPublished ? "active" : "draft"}
                    </span>
                  </td>

                  {/* Updated */}
                  <td className="px-3 py-3.5">
                    <span className="text-[11px] text-[#7A776F]">
                      {new Date(product.updatedAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3.5 relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === product.id ? null : product.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#8A8884] hover:text-[#8B6914] hover:bg-[#F3EEE3] transition-all opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                    {openMenu === product.id && (
                      <div className="absolute right-3 top-full mt-1 z-20 w-[150px] bg-white border border-[#E8E6E1] rounded-[10px] shadow-xl overflow-hidden">
                        {[
                          { icon: Eye,    label: "View", href: `/products/${product.id}` },
                          { icon: Pencil, label: "Edit", href: `/products/${product.id}/edit` },
                        ].map(({ icon: Icon, label, href }) => (
                          <Link key={label} href={href} onClick={() => setOpenMenu(null)}
                            className="flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-[#4A4946] hover:text-[#8B6914] hover:bg-[#F8F5EE] transition-all"
                          >
                            <Icon size={13} /> {label}
                          </Link>
                        ))}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-[#7A6045] hover:text-[#C8924A] hover:bg-[#2E231A] transition-all">
                              <Copy size={13} /> Duplicate
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Duplicate this product?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will create a copy as Draft so you can edit it safely before publishing.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => goToDuplicate(product.id)}>
                                Yes, Create Duplicate
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <button
                          onClick={() => togglePublished(product)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-[#4A4946] hover:text-[#8B6914] hover:bg-[#F8F5EE] transition-all"
                        >
                          <Eye size={13} /> {product.isPublished ? "Move to Draft" : "Publish"}
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-red-400 hover:bg-red-400/10 transition-all">
                              <Trash2 size={13} /> Delete
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this product?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. The product will be permanently removed.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={deleteProduct.isPending}>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => void handleDelete(product.id)}
                                disabled={deleteProduct.isPending}
                                className="bg-[#AF3E34] text-white hover:bg-[#922f27]"
                              >
                                {deleteProduct.isPending ? "Deleting..." : "Yes, Delete Product"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[#E8E6E1] flex items-center justify-between bg-[#FCFBF9]">
        <span className="text-[12px] text-[#7A776F]">{filtered.length} products</span>
        <span className="text-[12px] text-[#9A978F]">Page 1 of 1</span>
      </div>
    </div>
  );
}