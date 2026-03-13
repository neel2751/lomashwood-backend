"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";
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
import { useCreateProduct, useProduct } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";

type ProductCategory = "kitchen" | "bedroom";

export default function ProductDuplicatePage() {
  const params = useParams<{ id: string }>();
  const productId = params?.id;
  const router = useRouter();
  const toast = useToast();

  const { data: product, isLoading, isError } = useProduct(productId || "");
  const createProduct = useCreateProduct();
  const [duplicateTitle, setDuplicateTitle] = useState("");

  const productData = product as
    | {
        id: string;
        title: string;
        description: string;
        category: ProductCategory;
        rangeName: string;
        images?: string[];
        price?: number | null;
        styleId?: string | null;
        finishId?: string | null;
        isFeatured?: boolean;
        isPopular?: boolean;
        colours?: Array<{ id: string }>;
        sizes?: Array<{ id: string }>;
      }
    | undefined;

  const nextTitle = useMemo(() => {
    if (duplicateTitle.trim()) return duplicateTitle.trim();
    if (!productData?.title) return "";
    return `${productData.title} (Copy)`;
  }, [duplicateTitle, productData?.title]);

  const isSubmitting = createProduct.isPending;

  async function handleDuplicate() {
    if (!productData) return;

    try {
      const created = (await createProduct.mutateAsync({
        title: nextTitle,
        description: productData.description,
        category: productData.category,
        rangeName: productData.rangeName,
        images: productData.images || [],
        price: typeof productData.price === "number" ? productData.price : undefined,
        styleId: productData.styleId || undefined,
        finishId: productData.finishId || undefined,
        colourIds: (productData.colours || []).map((item) => item.id),
        sizeIds: (productData.sizes || []).map((item) => item.id),
        isPublished: false,
        isFeatured: productData.isFeatured ?? false,
        isPopular: productData.isPopular ?? false,
      })) as { id?: string };

      toast.success("Product duplicated as draft");
      router.push(created?.id ? `/products/${created.id}/edit` : "/products");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to duplicate product";
      toast.error("Failed to duplicate product", message);
    }
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-[#6B6B68]">Loading product...</div>;
  }

  if (isError || !productData) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">Unable to load this product for duplication.</p>
        <Link href="/products" className="text-sm text-[#8B6914] underline">Back to products</Link>
      </div>
    );
  }

  return (
    <div className="duplicate-page">
      <div className="duplicate-page__topbar">
        <PageHeader
          title="Duplicate Product"
          description="Create a draft copy that you can safely edit before publishing."
          backHref={`/products/${productData.id}`}
          backLabel="Product"
        />
      </div>

      <div className="duplicate-card">
        <div className="duplicate-card__section">
          <h2>Source Product</h2>
          <p>
            <strong>{productData.title}</strong> in {productData.category} / {productData.rangeName}
          </p>
          <p className="muted">
            Images: {(productData.images || []).length} · Colours: {(productData.colours || []).length} · Sizes: {(productData.sizes || []).length}
          </p>
        </div>

        <div className="duplicate-card__section">
          <label htmlFor="duplicate-title">New Product Title</label>
          <input
            id="duplicate-title"
            type="text"
            value={duplicateTitle}
            onChange={(e) => setDuplicateTitle(e.target.value)}
            placeholder={`${productData.title} (Copy)`}
          />
          <p className="muted">The duplicate will always be created with Draft status.</p>
        </div>

        <div className="duplicate-actions">
          <Link href={`/products/${productData.id}`} className="btn-ghost">Cancel</Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                disabled={isSubmitting || !nextTitle}
                className="btn-primary"
              >
                {isSubmitting ? "Duplicating..." : "Create Draft Duplicate"}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Create draft duplicate?</AlertDialogTitle>
                <AlertDialogDescription>
                  You are about to create a duplicate of this product. The new copy will be saved as Draft and remain hidden until published.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDuplicate} disabled={isSubmitting}>
                  {isSubmitting ? "Duplicating..." : "Yes, Create Draft"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <style>{`
        .duplicate-page {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .duplicate-card {
          max-width: 760px;
          background: #FFFFFF;
          border: 1.5px solid #E8E6E1;
          border-radius: 14px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .duplicate-card__section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .duplicate-card__section h2 {
          font-size: 0.95rem;
          font-weight: 700;
          color: #1A1A18;
        }

        .duplicate-card__section p {
          font-size: 0.92rem;
          color: #1A1A18;
          line-height: 1.5;
        }

        .muted {
          color: #6B6B68 !important;
          font-size: 0.84rem !important;
        }

        label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1A1A18;
        }

        input {
          width: 100%;
          height: 40px;
          border: 1.5px solid #E8E6E1;
          border-radius: 10px;
          padding: 0 12px;
          font-size: 0.92rem;
          outline: none;
        }

        input:focus {
          border-color: #8B6914;
          box-shadow: 0 0 0 3px rgba(139, 105, 20, 0.1);
        }

        .duplicate-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding-top: 4px;
        }

        .btn-primary {
          height: 38px;
          padding: 0 16px;
          border: none;
          border-radius: 8px;
          background: #1A1A18;
          color: #F5F0E8;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-ghost {
          height: 38px;
          padding: 0 14px;
          display: inline-flex;
          align-items: center;
          border: 1.5px solid #E8E6E1;
          border-radius: 8px;
          text-decoration: none;
          color: #1A1A18;
          font-size: 0.875rem;
          font-weight: 500;
          background: #FFFFFF;
        }
      `}</style>
    </div>
  );
}