import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { integrationService } from "@/services/integrationService"
import type { Integration } from "@/services/integrationService"

export const useIntegrations = () => {
  const queryClient = useQueryClient()

  const integrationsQuery = useQuery({
    queryKey: ["integrations"],
    queryFn: integrationService.getAll,
  })

const updateIntegration = useMutation({
  mutationFn: ({ id, payload }: { id: string; payload: Partial<Integration> }) =>
    integrationService.update(id, payload),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["integrations"] })
  },
})

  return {
    ...integrationsQuery,
    updateIntegration,
  }
}