import { eventHandlers, dispatchEvent } from './handlers';
import { EventPayload } from './payload.types';

export interface Subscription {
  topic: string;
  groupId: string;
  handler: (payload: EventPayload) => Promise<void>;
}

export interface SubscriptionManager {
  subscribe(subscription: Subscription): void;
  unsubscribe(topic: string): void;
  getSubscriptions(): Subscription[];
  startAll(): Promise<void>;
  stopAll(): Promise<void>;
}

class AppointmentSubscriptionManager implements SubscriptionManager {
  private readonly subscriptions: Map<string, Subscription> = new Map();
  private running = false;

  subscribe(subscription: Subscription): void {
    this.subscriptions.set(subscription.topic, subscription);
  }

  unsubscribe(topic: string): void {
    this.subscriptions.delete(topic);
  }

  getSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values());
  }

  async startAll(): Promise<void> {
    if (this.running) return;
    this.running = true;

    for (const subscription of this.subscriptions.values()) {
      await this.startSubscription(subscription);
    }
  }

  async stopAll(): Promise<void> {
    this.running = false;
  }

  private async startSubscription(subscription: Subscription): Promise<void> {
    void subscription;
  }
}

export const subscriptionManager = new AppointmentSubscriptionManager();

export const appointmentSubscriptions: Subscription[] = [
  {
    topic: 'appointment.booking.created',
    groupId: 'appointment-service-booking-created',
    handler: async (payload: EventPayload) => {
      await dispatchEvent('appointment.booking.created', payload);
    },
  },
  {
    topic: 'appointment.booking.cancelled',
    groupId: 'appointment-service-booking-cancelled',
    handler: async (payload: EventPayload) => {
      await dispatchEvent('appointment.booking.cancelled', payload);
    },
  },
  {
    topic: 'appointment.reminder.sent',
    groupId: 'appointment-service-reminder-sent',
    handler: async (payload: EventPayload) => {
      await dispatchEvent('appointment.reminder.sent', payload);
    },
  },
  {
    topic: 'appointment.consultant.updated',
    groupId: 'appointment-service-consultant-updated',
    handler: async (payload: EventPayload) => {
      await dispatchEvent('appointment.consultant.updated', payload);
    },
  },
  {
    topic: 'order.payment.succeeded',
    groupId: 'appointment-service-payment-succeeded',
    handler: async (payload: EventPayload) => {
      await dispatchEvent('order.payment.succeeded', payload);
    },
  },
  {
    topic: 'auth.user.created',
    groupId: 'appointment-service-user-created',
    handler: async (payload: EventPayload) => {
      await dispatchEvent('auth.user.created', payload);
    },
  },
];

export function registerSubscriptions(): void {
  for (const subscription of appointmentSubscriptions) {
    subscriptionManager.subscribe(subscription);
  }
}

export function getTopics(): string[] {
  return appointmentSubscriptions.map((s) => s.topic);
}

export function getHandlerForTopic(topic: string): ((payload: EventPayload) => Promise<void>) | undefined {
  return eventHandlers[topic] as ((payload: EventPayload) => Promise<void>) | undefined;
}

export async function initSubscriptions(): Promise<void> {
  registerSubscriptions();
  await subscriptionManager.startAll();
}

export async function teardownSubscriptions(): Promise<void> {
  await subscriptionManager.stopAll();
}