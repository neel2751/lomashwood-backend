import type { ISmsJobPayload, ISmsProviderResult } from './sms.types';
import { createLogger }    from '../../config/logger';
import { prisma }          from '../../infrastructure/db/prisma.client';
import { twilioClient }    from '../../infrastructure/sms/twilio.client';
import { msg91Client }     from '../../infrastructure/sms/msg91.client';
import { env }             from '../../config/env';
import { AppError }        from '../../shared/errors';

const logger = createLogger('sms.provider');

export interface ISmsProvider {
  send(payload: ISmsJobPayload): Promise<ISmsProviderResult>;
  name: string;
}

class TwilioProvider implements ISmsProvider {
  readonly name = 'twilio-sms';

  async send(payload: ISmsJobPayload): Promise<ISmsProviderResult> {
    logger.debug({ to: payload.to }, 'Sending via Twilio');

    const message = await twilioClient.messages.create({
      to:                  payload.to,
      from:                payload.from,
      body:                payload.body,
      messagingServiceSid: env.TWILIO_MESSAGING_SERVICE_SID ?? undefined,
    });

    return {
      providerMessageId: message.sid,
      providerResponse:  {
        sid:    message.sid,
        status: message.status,
        to:     message.to,
      },
      sentAt:   new Date(),
      segments: message.numSegments !== undefined
                  ? Number(message.numSegments)
                  : undefined,
    };
  }
}

class Msg91Provider implements ISmsProvider {
  readonly name = 'msg91-sms';

  async send(payload: ISmsJobPayload): Promise<ISmsProviderResult> {
    logger.debug({ to: payload.to }, 'Sending via MSG91');

    const result = await msg91Client.send({
      to:     payload.to,
      from:   payload.from,
      body:   payload.body,
    });

    return {
      providerMessageId: result.messageId,
      providerResponse:  result.raw,
      sentAt:            new Date(),
    };
  }
}

async function resolveProvider(): Promise<ISmsProvider> {
  if (env.SMS_PROVIDER === 'msg91') {
    return new Msg91Provider();
  }
  return new TwilioProvider();
}

async function resolveProviderWithFallback(): Promise<ISmsProvider> {
  const primary = await resolveProvider();

  const dbProvider = await prisma.notificationProvider.findFirst({
    where: {
      channel:   'SMS',
      status:    'ACTIVE',
      isDefault: true,
      deletedAt: null,
    },
    orderBy: { priority: 'asc' },
  });

  if (dbProvider === null) {
    logger.warn('No active default SMS provider found in DB — using config-based provider.');
  }

  return primary;
}

export async function sendViaProvider(payload: ISmsJobPayload): Promise<ISmsProviderResult> {
  const provider = await resolveProviderWithFallback();

  try {
    const result = await provider.send(payload);

    logger.info(
      {
        provider:          provider.name,
        notificationId:    payload.notificationId,
        providerMessageId: result.providerMessageId,
      },
      'SMS sent successfully.',
    );

    return result;
  } catch (err: unknown) {
    logger.error(
      { err, provider: provider.name, notificationId: payload.notificationId },
      'Primary SMS provider failed.',
    );

    if (provider.name === 'twilio-sms') {
      logger.warn('Attempting MSG91 fallback...');
      try {
        const fallback = new Msg91Provider();
        const result   = await fallback.send(payload);
        logger.info({ notificationId: payload.notificationId }, 'MSG91 fallback succeeded.');
        return result;
      } catch (fallbackErr: unknown) {
        logger.error({ fallbackErr }, 'MSG91 fallback also failed.');
        throw new AppError('All SMS providers failed.', 503);
      }
    }

    throw new AppError('SMS provider failed.', 503);
  }
}