"use client";

import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast"; 
import { registerToast } from "@/lib/toast";

export function ToastRegistrar() {
  const { toast } = useToast();

  useEffect(() => {
    registerToast(toast);
  }, [toast]);

  return null;
}