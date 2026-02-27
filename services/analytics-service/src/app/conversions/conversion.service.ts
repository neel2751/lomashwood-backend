import { ConversionRepository, Conversion, CreateConversionInput, FindManyConversionsInput, ConversionRateInput } from './conversion.repository';
import { AppError } from '../../shared/errors';

interface Logger {
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

export interface ListInput {
  goal?: string;
  sessionId?: string;
  userId?: string;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
}

export interface ListResult {
  data: Conversion[];
  total: number;
  page: number;
  limit: number;
}

export class ConversionService {
  constructor(
    private readonly repository: ConversionRepository,
    private readonly logger: Logger,
  ) {}

  async record(input: CreateConversionInput): Promise<Conversion> {
    const conversion = await this.repository.create(input);
    this.logger.info('Conversion recorded', { id: conversion.id, goal: conversion.goal });
    return conversion;
  }

  async getById(id: string): Promise<Conversion> {
    const conversion = await this.repository.findById(id);
    if (!conversion) throw new AppError('Conversion not found', 'NOT_FOUND');
    return conversion;
  }

  async list(input: ListInput): Promise<ListResult> {
    const query: FindManyConversionsInput = {
      goal: input.goal,
      sessionId: input.sessionId,
      userId: input.userId,
      from: input.from,
      to: input.to,
      page: input.page,
      limit: input.limit,
    };

    const [data, total] = await Promise.all([
      this.repository.findMany(query),
      this.repository.count(query),
    ]);

    return { data, total, page: input.page, limit: input.limit };
  }

  async getConversionRate(input: ConversionRateInput): Promise<number> {
    return this.repository.conversionRate(input);
  }
}