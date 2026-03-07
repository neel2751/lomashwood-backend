import { SetMetadata } from '@nestjs/common';

export const PAGINATION_METADATA = 'PAGINATION_METADATA';

export const Pagination = (options?: { defaultLimit?: number; maxLimit?: number }) => {
  return SetMetadata(PAGINATION_METADATA, {
    defaultLimit: options?.defaultLimit ?? 10,
    maxLimit: options?.maxLimit ?? 100,
  });
};
