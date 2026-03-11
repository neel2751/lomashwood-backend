"use client";

import { useRouter } from "next/navigation";

import { useDeleteProduct } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";
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

type ProductDeleteButtonProps = {
  productId: string;
  className?: string;
};

export function ProductDeleteButton({ productId, className }: ProductDeleteButtonProps) {
  const router = useRouter();
  const toast = useToast();
  const deleteProduct = useDeleteProduct();

  async function handleDelete() {
    try {
      await deleteProduct.mutateAsync(productId);
      toast.success("Product deleted");
      router.push("/products");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete product";
      toast.error("Failed to delete product", message);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          disabled={deleteProduct.isPending}
          className={className}
          title="Delete product"
        >
          {deleteProduct.isPending ? "Deleting..." : "Delete"}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this product?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The product and its linked options will be removed from the admin catalogue.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteProduct.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteProduct.isPending}
            className="bg-[#AF3E34] text-white hover:bg-[#922f27]"
          >
            {deleteProduct.isPending ? "Deleting..." : "Yes, Delete Product"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}