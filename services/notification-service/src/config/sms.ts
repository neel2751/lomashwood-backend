import { env } from './env';
import type { TwilioConfig } from '../infrastructure/sms/twilio.client';
import type { Msg91Config } from '../infrastructure/sms/msg91.client';

export const twilioConfig: TwilioConfig = {
  accountSid: env.TWILIO_ACCOUNT_SID ?? '',
  authToken: env.TWILIO_AUTH_TOKEN ?? '',
  from: env.TWILIO_FROM ?? '',
  messagingServiceSid: env.TWILIO_MESSAGING_SERVICE_SID,
  statusCallbackUrl: env.TWILIO_STATUS_CALLBACK_URL,
  maxRetries: 2,
};

export const msg91Config: Msg91Config = {
  authKey: env.MSG91_AUTH_KEY ?? '',
  senderId: env.MSG91_SENDER_ID ?? '',
  defaultCountry: env.MSG91_DEFAULT_COUNTRY,
  maxRetries: 2,
  timeoutMs: 10_000,
};

export const smsConfig = {
  activeProvider: env.ACTIVE_SMS_PROVIDER,
  twilio: twilioConfig,
  msg91: msg91Config,
} as const;