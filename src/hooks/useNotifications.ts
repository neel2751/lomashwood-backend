import { useQuery } from "@tanstack/react-query";

import { notificationService } from "@/services/notificationService";

import type { NotificationFilterParams } from "@/types/notification.types";

export function useNotifications(filters?: NotificationFilterParams) {
  return useQuery({
    queryKey: ["notifications", filters],
    queryFn: () => notificationService.getAll(filters),
  });
}

export function useNotification(id: string) {
  return useQuery({
    queryKey: ["notifications", id],
    queryFn: () => notificationService.getById(id),
    enabled: !!id,
  });
}

export function useEmailNotifications(filters?: NotificationFilterParams) {
  return useQuery({
    queryKey: ["notifications", "email", filters],
    queryFn: () => notificationService.getByChannel("email", filters),
  });
}

export function useSmsNotifications(filters?: NotificationFilterParams) {
  return useQuery({
    queryKey: ["notifications", "sms", filters],
    queryFn: () => notificationService.getByChannel("sms", filters),
  });
}

export function usePushNotifications(filters?: NotificationFilterParams) {
  return useQuery({
    queryKey: ["notifications", "push", filters],
    queryFn: () => notificationService.getByChannel("push", filters),
  });
}