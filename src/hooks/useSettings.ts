import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

async function fetchSettings(section: string) {
  const res = await fetch(`/api/settings/${section}`);
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

async function saveSettings(section: string, data: unknown) {
  const res = await fetch(`/api/settings/${section}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to save settings");
  return res.json();
}

export function useSettings(section: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["settings", section],
    queryFn: () => fetchSettings(section),
  });

  const mutation = useMutation({
    mutationFn: (data: unknown) => saveSettings(section, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["settings", section] });
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    updateSettings: (_sec: string, data: unknown) => mutation.mutateAsync(data),
    isSubmitting: mutation.isPending,
  };
}