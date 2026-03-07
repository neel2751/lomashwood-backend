"use client";

import { useEffect } from "react";

import { useToast } from "@/hooks/use-toast";
import { registerToast } from "@/lib/toast";

export function ToastRegistrar() {
  const toast = useToast();

  useEffect(() => {
    registerToast(({ title, description, variant }) => {
      if (variant === "destructive") {
        toast.error(title, description);
      } else {
        toast.info(title, description);
      }
    });
  }, [toast]);

  return null;
}