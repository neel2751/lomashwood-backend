import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

const errorRate = new Rate("order_errors");
const createIntentDuration = new Trend("order_create_intent_duration");
const createOrderDuration = new Trend("order_create_duration");
const listOrdersDuration = new Trend("order_list_duration");
const orderDetailDuration = new Trend("order_detail_duration");
const webhookDuration = new Trend("order_webhook_duration");
const successfulPaymentIntents = new Counter("order_payment_intents_created");
const webhookSuccesses = new Counter("order_webhook_successes");

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const API_VERSION = "/v1";
const AUTH_TOKEN = __ENV.AUTH_TOKEN || "";
const STRIPE_WEBHOOK_SECRET = __ENV.STRIPE_WEBHOOK_SECRET || "whsec_test_secret";

export const options = {
  scenarios: {
    checkout_load: {
      executor: "constant-vus",
      vus: 20,
      duration: "2m",
      tags: { scenario: "checkout_load" },
    },
    payment_stress: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 25 },
        { duration: "1m", target: 60 },
        { duration: "30s", target: 25 },
        { duration: "20s", target: 0 },
      ],
      tags: { scenario: "payment_stress" },
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<1200", "p(99)<2500"],
    http_req_failed: ["rate<0.01"],
    order_errors: ["rate<0.05"],
    order_create_intent_duration: ["p(95)<1000"],
    order_create_duration: ["p(95)<1000"],
    order_list_duration: ["p(95)<600"],
    order_detail_duration: ["p(95)<400"],
    order_webhook_duration: ["p(95)<500"],
  },
};

const CURRENCIES = ["GBP"];
const ORDER_STATUSES = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED"];
const PAYMENT_METHODS = ["STRIPE", "FINANCE", "BANK_TRANSFER"];
const UK_POSTCODES = ["SW1A 1AA", "EC1A 1BB", "M1 1AE", "B1 1BB", "LS1 1BA"];
const UK_CITIES = ["London", "Manchester", "Birmingham", "Leeds", "Bristol"];

function getHeaders(token, extra) {
  const headers = { "Content-Type": "application/json", ...extra };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAmount(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

function generateOrderPayload(products) {
  const selectedProducts = products.slice(0, Math.floor(Math.random() * 2) + 1);
  const items = selectedProducts.map((p) => ({
    productId: p.id,
    quantity: 1,
  }));

  const city = randomItem(UK_CITIES);
  const postcode = randomItem(UK_POSTCODES);

  return {
    items,
    paymentMethod: randomItem(PAYMENT_METHODS),
    deliveryAddress: {
      line1: `${Math.floor(Math.random() * 200) + 1} Test Street`,
      city,
      postcode,
      country: "GB",
    },
    notes: Math.random() > 0.7 ? "Load test order note" : undefined,
  };
}

function getProducts() {
  const res = http.get(
    `${BASE_URL}${API_VERSION}/products?limit=10&isPublished=true`,
    {
      headers: getHeaders(AUTH_TOKEN),
      tags: { endpoint: "get_products_for_order" },
    }
  );

  if (res.status === 200) {
    try {
      const body = JSON.parse(res.body);
      return body.data?.items || body.data || [];
    } catch {
      return [];
    }
  }

  return [];
}

function createPaymentIntent(amount) {
  const payload = JSON.stringify({
    amount: amount || randomAmount(300000, 2000000),
    currency: "GBP",
    metadata: {
      source: "load_test",
      vuId: String(__VU),
    },
  });

  const start = Date.now();
  const res = http.post(
    `${BASE_URL}${API_VERSION}/payments/create-intent`,
    payload,
    {
      headers: getHeaders(AUTH_TOKEN),
      tags: { endpoint: "create_payment_intent" },
    }
  );
  createIntentDuration.add(Date.now() - start);

  const success = check(res, {
    "payment intent created 200": (r) => r.status === 200 || r.status === 201,
    "payment intent has client secret": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && (body.data.clientSecret || body.data.client_secret);
      } catch {
        return false;
      }
    },
    "payment intent has id": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && (body.data.paymentIntentId || body.data.id);
      } catch {
        return false;
      }
    },
  });

  if (success) {
    successfulPaymentIntents.add(1);
    try {
      const body = JSON.parse(res.body);
      return body.data;
    } catch {
      return null;
    }
  }

  errorRate.add(!success);
  return null;
}

function createOrder(orderPayload) {
  const start = Date.now();
  const res = http.post(
    `${BASE_URL}${API_VERSION}/orders`,
    JSON.stringify(orderPayload),
    {
      headers: getHeaders(AUTH_TOKEN),
      tags: { endpoint: "create_order" },
    }
  );
  createOrderDuration.add(Date.now() - start);

  const success = check(res, {
    "order created 201": (r) => r.status === 201,
    "order has reference": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.orderReference;
      } catch {
        return false;
      }
    },
    "order has total amount": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && typeof body.data.totalAmount === "number";
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success);

  if (success) {
    try {
      return JSON.parse(res.body).data;
    } catch {
      return null;
    }
  }

  return null;
}

function listOrders(page, limit) {
  const params = new URLSearchParams({
    page: page || 1,
    limit: limit || 10,
  });

  const start = Date.now();
  const res = http.get(
    `${BASE_URL}${API_VERSION}/orders?${params.toString()}`,
    {
      headers: getHeaders(AUTH_TOKEN),
      tags: { endpoint: "list_orders" },
    }
  );
  listOrdersDuration.add(Date.now() - start);

  const success = check(res, {
    "orders list status 200": (r) => r.status === 200,
    "orders list has data": (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data) || Array.isArray(body.data?.items);
      } catch {
        return false;
      }
    },
    "orders list has pagination": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.meta && typeof body.meta.total !== "undefined";
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success);

  if (success) {
    try {
      const body = JSON.parse(res.body);
      return body.data?.items || body.data || [];
    } catch {
      return [];
    }
  }

  return [];
}

function getOrderDetail(orderId) {
  if (!orderId) return;

  const start = Date.now();
  const res = http.get(
    `${BASE_URL}${API_VERSION}/orders/${orderId}`,
    {
      headers: getHeaders(AUTH_TOKEN),
      tags: { endpoint: "order_detail" },
    }
  );
  orderDetailDuration.add(Date.now() - start);

  const success = check(res, {
    "order detail status 200": (r) => r.status === 200,
    "order detail has status": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.status;
      } catch {
        return false;
      }
    },
    "order detail has items": (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data?.items);
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success);
}

function simulateStripeWebhook(eventType, data) {
  const event = {
    id: `evt_${Math.random().toString(36).substring(7)}`,
    type: eventType,
    data: { object: data },
    created: Math.floor(Date.now() / 1000),
  };

  const start = Date.now();
  const res = http.post(
    `${BASE_URL}${API_VERSION}/webhooks/stripe`,
    JSON.stringify(event),
    {
      headers: getHeaders(null, {
        "stripe-signature": `t=${Math.floor(Date.now() / 1000)},v1=loadtest_signature`,
        "Content-Type": "application/json",
      }),
      tags: { endpoint: "stripe_webhook" },
    }
  );
  webhookDuration.add(Date.now() - start);

  const success = check(res, {
    "webhook processed 200": (r) => r.status === 200,
  });

  if (success) {
    webhookSuccesses.add(1);
  }

  errorRate.add(!success);
}

function testUnauthorizedOrderAccess() {
  const res = http.get(`${BASE_URL}${API_VERSION}/orders`, {
    headers: { "Content-Type": "application/json" },
    tags: { endpoint: "orders_unauthorized" },
  });

  check(res, {
    "unauthorized orders returns 401": (r) => r.status === 401,
  });
}

function testInvalidOrderCreation() {
  const res = http.post(
    `${BASE_URL}${API_VERSION}/orders`,
    JSON.stringify({ items: [] }),
    {
      headers: getHeaders(AUTH_TOKEN),
      tags: { endpoint: "order_invalid" },
    }
  );

  check(res, {
    "invalid order returns 400 or 422": (r) => r.status === 400 || r.status === 422,
  });
}

export default function () {
  const scenario = Math.random();

  group("order_flows", () => {
    if (scenario < 0.3) {
      group("checkout_flow", () => {
        const products = getProducts();
        sleep(0.5);

        if (products.length > 0) {
          const paymentIntent = createPaymentIntent(randomAmount(300000, 2000000));
          sleep(0.5);

          if (paymentIntent) {
            const orderPayload = generateOrderPayload(products);
            const order = createOrder({
              ...orderPayload,
              paymentIntentId: paymentIntent.paymentIntentId || paymentIntent.id,
            });

            if (order) {
              sleep(0.5);
              getOrderDetail(order.id);
            }
          }
        }
      });
    } else if (scenario < 0.55) {
      group("payment_intent_only", () => {
        const amount = randomAmount(300000, 2000000);
        createPaymentIntent(amount);
        sleep(0.5);
      });
    } else if (scenario < 0.75) {
      group("order_listing", () => {
        const orders = listOrders(1, 10);
        sleep(0.5);

        if (orders.length > 0) {
          const order = orders[Math.floor(Math.random() * orders.length)];
          getOrderDetail(order.id);
        }
      });
    } else if (scenario < 0.88) {
      group("webhook_simulation", () => {
        simulateStripeWebhook("payment_intent.succeeded", {
          id: `pi_${Math.random().toString(36).substring(7)}`,
          amount: randomAmount(300000, 2000000),
          currency: "gbp",
          status: "succeeded",
        });
        sleep(0.3);
      });
    } else {
      group("error_cases", () => {
        testUnauthorizedOrderAccess();
        sleep(0.3);
        testInvalidOrderCreation();
        sleep(0.3);
      });
    }
  });

  sleep(Math.random() * 2 + 1);
}

export function handleSummary(data) {
  return {
    "reports/order-summary.json": JSON.stringify(data, null, 2),
    stdout: `
Order Load Test Summary
=======================
Total Requests:            ${data.metrics.http_reqs.values.count}
Failed Requests:           ${data.metrics.http_req_failed.values.passes}
Error Rate:                ${(data.metrics.order_errors?.values.rate * 100 || 0).toFixed(2)}%
Avg Payment Intent:        ${(data.metrics.order_create_intent_duration?.values.avg || 0).toFixed(2)}ms
P95 Payment Intent:        ${(data.metrics.order_create_intent_duration?.values["p(95)"] || 0).toFixed(2)}ms
Avg Order Create:          ${(data.metrics.order_create_duration?.values.avg || 0).toFixed(2)}ms
P95 Order Create:          ${(data.metrics.order_create_duration?.values["p(95)"] || 0).toFixed(2)}ms
Avg Webhook:               ${(data.metrics.order_webhook_duration?.values.avg || 0).toFixed(2)}ms
Payment Intents Created:   ${data.metrics.order_payment_intents_created?.values.count || 0}
Webhook Successes:         ${data.metrics.order_webhook_successes?.values.count || 0}
    `,
  };
}