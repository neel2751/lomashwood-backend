import { Prisma } from '@prisma/client';

import { logger } from '../../config/logger';

export const loggingExtension = Prisma.defineExtension({
  name: 'logging',
  query: {
    async $allOperations({ operation, model, args, query }) {
      const start = Date.now();
      const result = await query(args);
      const duration = Date.now() - start;

      if (duration > 1000) {
        logger.warn(
          { model, operation, duration },
          'Slow Prisma query detected',
        );
      }

      return result;
    },
  },
});

export const softDeleteExtension = Prisma.defineExtension({
  name: 'softDelete',
  model: {
    $allModels: {
      async softDelete<T>(
        this: T,
        where: Prisma.Args<T, 'update'>['where'],
      ): Promise<Prisma.Result<T, { data: { deletedAt: Date } }, 'update'>> {
        const context = Prisma.getExtensionContext(this);
        return (context as unknown as { update: (args: unknown) => Promise<unknown> }).update({
          where,
          data: { deletedAt: new Date() },
        }) as Promise<Prisma.Result<T, { data: { deletedAt: Date } }, 'update'>>;
      },
    },
  },
});