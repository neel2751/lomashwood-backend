import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { integrationService } from "@/services/integrationService";

import type { IntegrationId } from "@/components/settings/IntegrationCard";
import type { Integration } from "@/services/integrationService";

export type IntegrationEntry = {
  status: "connected" | "disconnected" | "error";
  enabled: boolean;
  credentials?: Record<string, string>;
};

export type IntegrationResponse = Partial<Record<IntegrationId, IntegrationEntry>>;

export const useIntegrations = () => {
  const queryClient = useQueryClient();

  const integrationsQuery = useQuery({
    queryKey: ["integrations"],
    queryFn: integrationService.getAll,
  });

  const updateIntegration = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Integration> }) =>
      integrationService.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
  });

  const toggleIntegration = async (id: IntegrationId, enabled: boolean) => {
    await updateIntegration.mutateAsync({ id, payload: { enabled } });
  };

  const saveIntegration = async (id: IntegrationId, values: Record<string, string>) => {
    await updateIntegration.mutateAsync({ id, payload: { credentials: values, status: "connected" } });
  };

  const testIntegration = async (id: IntegrationId) => {
    await integrationService.getById(id);
  };

  const disconnectIntegration = async (id: IntegrationId) => {
    await updateIntegration.mutateAsync({ id, payload: { enabled: false, credentials: {} } });
  };

  return {
    ...integrationsQuery,
    data: integrationsQuery.data as IntegrationResponse | undefined,
    updateIntegration,
    toggleIntegration,
    saveIntegration,
    testIntegration,
    disconnectIntegration,
  };
};