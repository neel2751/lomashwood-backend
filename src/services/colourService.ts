import { productClient } from "@/lib/api-client";
import type { Colour } from "@/lib/api-client";

export const colourService = {
  getAll: (params?: Record<string, unknown>) =>
    productClient.colours.getAll(params),

  getById: (id: string) => productClient.colours.getById(id),

  create: (payload: Partial<Colour>) =>
    productClient.colours.create(payload),

  update: (id: string, payload: Partial<Colour>) =>
    productClient.colours.update(id, payload),

  patch: (id: string, payload: Partial<Colour>) =>
    productClient.colours.patch(id, payload),

  remove: (id: string) => productClient.colours.remove(id),
};