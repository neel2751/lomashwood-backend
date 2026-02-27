import { env } from './env';
import type { FirebaseConfig } from '../infrastructure/push/firebase.client';
import type { WebPushConfig } from '../infrastructure/push/webpush.client';

export const firebaseConfig: FirebaseConfig = {
  projectId: env.FIREBASE_PROJECT_ID ?? '',
  serviceAccount: env.FIREBASE_SERVICE_ACCOUNT_JSON
    ? (JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON) as Record<string, unknown>)
    : {},
  appName: 'lomash-notification',
};

export const webPushConfig: WebPushConfig = {
  vapidPublicKey: env.VAPID_PUBLIC_KEY ?? '',
  vapidPrivateKey: env.VAPID_PRIVATE_KEY ?? '',
  subject: env.VAPID_SUBJECT ?? '',
  defaultTtl: 86_400,
};

export const pushConfig = {
  activeProvider: env.ACTIVE_PUSH_PROVIDER,
  firebase: firebaseConfig,
  webpush: webPushConfig,
} as const;