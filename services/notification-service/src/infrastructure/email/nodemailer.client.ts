import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import { Logger } from 'winston';
import { EmailSendRequest, EmailSendResult } from './email.types';

export interface NodemailerConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
  pool?: boolean;
  maxConnections?: number;
  maxMessages?: number;
  rateDelta?: number;
  rateLimit?: number;
}

export class NodemailerClient {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(
    private readonly config: NodemailerConfig,
    private readonly logger: Logger,
  ) {
    this.from = config.from;
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
      pool: config.pool ?? true,
      maxConnections: config.maxConnections ?? 5,
      maxMessages: config.maxMessages ?? 100,
      rateDelta: config.rateDelta ?? 1000,
      rateLimit: config.rateLimit ?? 5,
    });
  }

  async send(req: EmailSendRequest): Promise<EmailSendResult> {
    const mailOptions: SendMailOptions = {
      from: req.from ?? this.from,
      to: Array.isArray(req.to) ? req.to.join(', ') : req.to,
      subject: req.subject,
      html: req.htmlBody,
      text: req.textBody,
      ...(req.cc && { cc: Array.isArray(req.cc) ? req.cc.join(', ') : req.cc }),
      ...(req.bcc && { bcc: Array.isArray(req.bcc) ? req.bcc.join(', ') : req.bcc }),
      ...(req.replyTo && { replyTo: req.replyTo }),
      ...(req.attachments && {
        attachments: req.attachments.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
          encoding: a.encoding ?? 'base64',
        })),
      }),
      ...(req.headers && { headers: req.headers }),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);

      this.logger.info('Nodemailer email sent', {
        messageId: info.messageId,
        to: req.to,
        subject: req.subject,
      });

      return {
        success: true,
        messageId: info.messageId,
        provider: 'nodemailer',
      };
    } catch (err: unknown) {
      const error = err as { message?: string; code?: string };
      this.logger.error('Nodemailer send failed', {
        error: error.message,
        code: error.code,
        to: req.to,
        subject: req.subject,
      });

      return {
        success: false,
        provider: 'nodemailer',
        errorCode: error.code,
        errorMessage: error.message,
      };
    }
  }

  async sendBulk(requests: EmailSendRequest[]): Promise<EmailSendResult[]> {
    return Promise.all(requests.map((req) => this.send(req)));
  }

  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (err: unknown) {
      this.logger.warn('Nodemailer verify failed', { error: (err as Error).message });
      return false;
    }
  }

  async close(): Promise<void> {
    this.transporter.close();
  }
}