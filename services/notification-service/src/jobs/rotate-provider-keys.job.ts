import cron from 'node-cron';
import { Logger } from 'winston';
import type { EmailService } from '../app/email/email.service';
import type { PushHealthChecker } from '../infrastructure/push/push-health';
import type { SmsHealthChecker } from '../infrastructure/sms/sms-health';
import type { EmailHealthChecker } from '../infrastructure/email/email-health';
import { env } from '../config/env';

export function startRotateProviderKeysJob(deps: {
  emailService: EmailService;
  emailHealthChecker: EmailHealthChecker;
  smsHealthChecker: SmsHealthChecker;
  pushHealthChecker: PushHealthChecker;
  logger: Logger;
}): cron.ScheduledTask {
  return cron.schedule('0 9 * * 1', async () => {
    deps.logger.info('rotate-provider-keys job started');

    try {
      const [emailHealth, smsHealth, pushHealth] = await Promise.all([
        deps.emailHealthChecker.checkAll(env.ACTIVE_EMAIL_PROVIDER as never),
        deps.smsHealthChecker.checkAll(env.ACTIVE_SMS_PROVIDER as never),
        deps.pushHealthChecker.checkAll(env.ACTIVE_PUSH_PROVIDER as never),
      ]);

      const degradedProviders: string[] = [];

      if (!emailHealth.overall) degradedProviders.push(`Email (${emailHealth.activeProvider})`);
      if (!smsHealth.overall) degradedProviders.push(`SMS (${smsHealth.activeProvider})`);
      if (!pushHealth.overall) degradedProviders.push(`Push (${pushHealth.activeProvider})`);

      const adminEmail = env.ADMIN_DUAL_BOOKING_EMAIL;

      if (degradedProviders.length && adminEmail) {
        await deps.emailService.send({
          to: adminEmail,
          subject: '[Lomash Wood] Weekly Provider Health Report — Action Required',
          textBody: [
            'Weekly notification provider health check.',
            '',
            'Degraded providers detected:',
            ...degradedProviders.map((p) => `  - ${p}`),
            '',
            'Please rotate API keys or check provider dashboards.',
            '',
            `Checked at: ${new Date().toISOString()}`,
          ].join('\n'),
        });

        deps.logger.warn('rotate-provider-keys: degraded providers found', {
          degradedProviders,
        });
      } else {
        deps.logger.info('rotate-provider-keys: all providers healthy');
      }
    } catch (err: unknown) {
      deps.logger.error('rotate-provider-keys job error', {
        error: (err as Error).message,
      });
    }
  });
}