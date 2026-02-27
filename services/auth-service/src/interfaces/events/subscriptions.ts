import { eventRegistry, EventHandler, EventPayload } from './handlers';

export enum EventType {
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_LOGGED_IN = 'user.logged_in',
  USER_LOGGED_OUT = 'user.logged_out',
  USER_PASSWORD_CHANGED = 'user.password_changed',
  USER_EMAIL_VERIFIED = 'user.email_verified',

  SESSION_CREATED = 'session.created',
  SESSION_EXPIRED = 'session.expired',
  SESSION_REVOKED = 'session.revoked',

  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated',
  PRODUCT_DELETED = 'product.deleted',
  PRODUCT_PRICE_CHANGED = 'product.price_changed',

  INVENTORY_UPDATED = 'inventory.updated',
  INVENTORY_LOW_STOCK = 'inventory.low_stock',
  INVENTORY_OUT_OF_STOCK = 'inventory.out_of_stock',

  ORDER_CREATED = 'order.created',
  ORDER_UPDATED = 'order.updated',
  ORDER_CANCELLED = 'order.cancelled',
  ORDER_COMPLETED = 'order.completed',
  ORDER_SHIPPED = 'order.shipped',
  ORDER_DELIVERED = 'order.delivered',

  PAYMENT_INITIATED = 'payment.initiated',
  PAYMENT_SUCCEEDED = 'payment.succeeded',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',

  APPOINTMENT_CREATED = 'appointment.created',
  APPOINTMENT_UPDATED = 'appointment.updated',
  APPOINTMENT_CANCELLED = 'appointment.cancelled',
  APPOINTMENT_COMPLETED = 'appointment.completed',
  APPOINTMENT_REMINDER_SENT = 'appointment.reminder_sent',

  BLOG_CREATED = 'blog.created',
  BLOG_UPDATED = 'blog.updated',
  BLOG_PUBLISHED = 'blog.published',
  BLOG_DELETED = 'blog.deleted',

  MEDIA_UPLOADED = 'media.uploaded',
  MEDIA_DELETED = 'media.deleted',

  EMAIL_SENT = 'email.sent',
  EMAIL_FAILED = 'email.failed',
  EMAIL_DELIVERED = 'email.delivered',
  EMAIL_OPENED = 'email.opened',
  EMAIL_CLICKED = 'email.clicked',

  SMS_SENT = 'sms.sent',
  SMS_FAILED = 'sms.failed',
  SMS_DELIVERED = 'sms.delivered',

  PUSH_SENT = 'push.sent',
  PUSH_FAILED = 'push.failed',
  PUSH_DELIVERED = 'push.delivered',

  REVIEW_CREATED = 'review.created',
  REVIEW_UPDATED = 'review.updated',
  REVIEW_DELETED = 'review.deleted',
  REVIEW_APPROVED = 'review.approved',
  REVIEW_REJECTED = 'review.rejected',

  WISHLIST_ITEM_ADDED = 'wishlist.item_added',
  WISHLIST_ITEM_REMOVED = 'wishlist.item_removed',

  CART_ITEM_ADDED = 'cart.item_added',
  CART_ITEM_REMOVED = 'cart.item_removed',
  CART_CLEARED = 'cart.cleared',

  ANALYTICS_EVENT_TRACKED = 'analytics.event_tracked',
  ANALYTICS_PAGE_VIEWED = 'analytics.page_viewed',
  ANALYTICS_CONVERSION_TRACKED = 'analytics.conversion_tracked',
}

export class EventSubscription {
  private unsubscribe: (() => void) | null = null;

  constructor(
    private eventType: string,
    private handler: EventHandler
  ) {
    this.subscribe();
  }

  // FIX 1: Expose handler so EventSubscriptionManager can compare by handler reference
  getHandler(): EventHandler {
    return this.handler;
  }

  private subscribe(): void {
    eventRegistry.register(this.eventType, this.handler);
  }

  cancel(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    eventRegistry.unregister(this.eventType, this.handler);
  }
}

export class EventSubscriptionManager {
  private subscriptions: Map<string, EventSubscription[]> = new Map();

  subscribe(eventType: EventType | string, handler: EventHandler): EventSubscription {
    const subscription = new EventSubscription(eventType, handler);

    const existing = this.subscriptions.get(eventType) || [];
    existing.push(subscription);
    this.subscriptions.set(eventType, existing);

    return subscription;
  }

  subscribeMultiple(eventTypes: (EventType | string)[], handler: EventHandler): EventSubscription[] {
    return eventTypes.map((eventType) => this.subscribe(eventType, handler));
  }

  unsubscribe(eventType: EventType | string, handler: EventHandler): void {
    const subscriptions = this.subscriptions.get(eventType);
    if (!subscriptions) return;

    // FIX 1: Compare against the subscription's stored handler, not the subscription itself
    const index = subscriptions.findIndex((sub) => sub.getHandler() === handler);

    // FIX 2: Guard access with explicit index check before use
    if (index > -1) {
      const subscription = subscriptions[index];
      if (subscription) {
        subscription.cancel();
        subscriptions.splice(index, 1);
      }
    }

    if (subscriptions.length === 0) {
      this.subscriptions.delete(eventType);
    }
  }

  unsubscribeAll(eventType: EventType | string): void {
    const subscriptions = this.subscriptions.get(eventType);
    if (!subscriptions) return;

    subscriptions.forEach((sub) => sub.cancel());
    this.subscriptions.delete(eventType);
  }

  clear(): void {
    this.subscriptions.forEach((subscriptions) => {
      subscriptions.forEach((sub) => sub.cancel());
    });
    this.subscriptions.clear();
  }

  getSubscriptionCount(eventType: EventType | string): number {
    return (this.subscriptions.get(eventType) || []).length;
  }

  getAllSubscriptions(): Map<string, EventSubscription[]> {
    return new Map(this.subscriptions);
  }
}

export class EventRouter {
  private routes: Map<string, (payload: EventPayload) => string[]> = new Map();

  addRoute(eventType: string, router: (payload: EventPayload) => string[]): void {
    this.routes.set(eventType, router);
  }

  route(payload: EventPayload): string[] {
    const router = this.routes.get(payload.eventType);
    if (!router) {
      return [payload.eventType];
    }
    return router(payload);
  }

  removeRoute(eventType: string): void {
    this.routes.delete(eventType);
  }

  clearRoutes(): void {
    this.routes.clear();
  }
}

export class ConditionalSubscription {
  constructor(
    private eventType: string,
    private handler: EventHandler,
    private condition: (payload: EventPayload) => boolean
  ) {}

  subscribe(): EventSubscription {
    const conditionalHandler: EventHandler = {
      handle: async (payload: EventPayload) => {
        if (this.condition(payload)) {
          await this.handler.handle(payload);
        }
      },
    };

    return new EventSubscription(this.eventType, conditionalHandler);
  }
}

export class TemporarySubscription {
  private subscription: EventSubscription | null = null;
  private timeout: NodeJS.Timeout | null = null;

  constructor(
    private eventType: string,
    private handler: EventHandler,
    private duration: number
  ) {}

  start(): void {
    this.subscription = new EventSubscription(this.eventType, this.handler);

    this.timeout = setTimeout(() => {
      this.stop();
    }, this.duration);
  }

  stop(): void {
    if (this.subscription) {
      this.subscription.cancel();
      this.subscription = null;
    }

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
}

export class SubscriptionGroup {
  private subscriptions: EventSubscription[] = [];

  add(subscription: EventSubscription): void {
    this.subscriptions.push(subscription);
  }

  cancelAll(): void {
    this.subscriptions.forEach((sub) => sub.cancel());
    this.subscriptions = [];
  }

  size(): number {
    return this.subscriptions.length;
  }
}

export function setupDefaultSubscriptions(manager: EventSubscriptionManager): void {
  manager.subscribe(EventType.USER_CREATED, {
    handle: async (payload) => {
      await eventRegistry.emit(EventType.EMAIL_SENT, {
        to: payload.data.email,
        template: 'welcome',
        data: payload.data,
      });
    },
  });

  manager.subscribe(EventType.ORDER_CREATED, {
    handle: async (payload) => {
      await eventRegistry.emit(EventType.EMAIL_SENT, {
        to: payload.data.customerEmail,
        template: 'order_confirmation',
        data: payload.data,
      });

      await eventRegistry.emit(EventType.INVENTORY_UPDATED, {
        orderId: payload.data.orderId,
        items: payload.data.items,
      });
    },
  });

  manager.subscribe(EventType.PAYMENT_SUCCEEDED, {
    handle: async (payload) => {
      await eventRegistry.emit(EventType.ORDER_UPDATED, {
        orderId: payload.data.orderId,
        status: 'paid',
      });

      await eventRegistry.emit(EventType.EMAIL_SENT, {
        to: payload.data.customerEmail,
        template: 'payment_confirmation',
        data: payload.data,
      });
    },
  });

  manager.subscribe(EventType.APPOINTMENT_CREATED, {
    handle: async (payload) => {
      await eventRegistry.emit(EventType.EMAIL_SENT, {
        to: payload.data.customerEmail,
        template: 'appointment_confirmation',
        data: payload.data,
      });

      await eventRegistry.emit(EventType.SMS_SENT, {
        to: payload.data.customerPhone,
        template: 'appointment_confirmation',
        data: payload.data,
      });
    },
  });

  manager.subscribe(EventType.BLOG_PUBLISHED, {
    handle: async (payload) => {
      await eventRegistry.emit(EventType.ANALYTICS_EVENT_TRACKED, {
        event: 'blog_published',
        data: payload.data,
      });
    },
  });

  manager.subscribe(EventType.INVENTORY_LOW_STOCK, {
    handle: async (payload) => {
      await eventRegistry.emit(EventType.EMAIL_SENT, {
        to: 'admin@lomashwood.com',
        template: 'low_stock_alert',
        data: payload.data,
      });
    },
  });

  manager.subscribe(EventType.REVIEW_CREATED, {
    handle: async (payload) => {
      await eventRegistry.emit(EventType.EMAIL_SENT, {
        to: 'admin@lomashwood.com',
        template: 'new_review',
        data: payload.data,
      });
    },
  });

  manager.subscribe(EventType.ORDER_CANCELLED, {
    handle: async (payload) => {
      await eventRegistry.emit(EventType.INVENTORY_UPDATED, {
        orderId: payload.data.orderId,
        items: payload.data.items,
        action: 'restore',
      });

      if (payload.data.paymentId) {
        await eventRegistry.emit(EventType.PAYMENT_REFUNDED, {
          paymentId: payload.data.paymentId,
          orderId: payload.data.orderId,
          amount: payload.data.amount,
        });
      }
    },
  });
}

export const subscriptionManager = new EventSubscriptionManager();
export const eventRouter = new EventRouter();
export default subscriptionManager;