import { SetMetadata } from '@nestjs/common';

export const RESPONSE_METADATA = 'RESPONSE_METADATA';

export const ApiResponse = (options?: { message?: string; success?: boolean }) => {
  return SetMetadata(RESPONSE_METADATA, {
    success: options?.success ?? true,
    message: options?.message,
  });
};
