import { useQuery } from "@tanstack/react-query";
import { notificationService } from "@/services/notificationService";
import type { NotificationFilters } from "@/types/notification.types";

export function useNotifications(filters?: NotificationFilters) {
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

export function useEmailNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: ["notifications", "email", filters],
    queryFn: () => notificationService.getByChannel("email", filters),
  });
}

export function useSmsNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: ["notifications", "sms", filters],
    queryFn: () => notificationService.getByChannel("sms", filters),
  });
}

export function usePushNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: ["notifications", "push", filters],
    queryFn: () => notificationService.getByChannel("push", filters),
  });
}