import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

const errorRate = new Rate("notification_errors");
const sendEmailDuration = new Trend("notification_send_email_duration");
const sendSmsDuration = new Trend("notification_send_sms_duration");
const templateDuration = new Trend("notification_template_duration");
const listDuration = new Trend("notification_list_duration");
const successfulEmails = new Counter("notification_emails_sent");
const successfulSms = new Counter("notification_sms_sent");

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const API_VERSION = "/v1";
const AUTH_TOKEN = __ENV.AUTH_TOKEN || "";

export const options = {
  scenarios: {
    steady_notifications: {
      executor: "constant-vus",
      vus: 10,
      duration: "2m",
      tags: { scenario: "steady_notifications" },
    },
    burst_notifications: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "20s", target: 20 },
        { duration: "40s", target: 50 },
        { duration: "20s", target: 20 },
        { duration: "20s", target: 0 },
      ],
      tags: { scenario: "burst_notifications" },
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<1500", "p(99)<3000"],
    http_req_failed: ["rate<0.02"],
    notification_errors: ["rate<0.05"],
    notification_send_email_duration: ["p(95)<1000"],
    notification_send_sms_duration: ["p(95)<800"],
    notification_template_duration: ["p(95)<400"],
    notification_list_duration: ["p(95)<500"],
  },
};

const EMAIL_TEMPLATES = [
  "booking_confirmation",
  "booking_reminder",
  "payment_receipt",
  "brochure_delivery",
  "order_confirmation",
  "welcome",
  "password_reset",
];

const SMS_TEMPLATES = [
  "booking_confirmation_sms",
  "booking_reminder_sms",
  "order_update_sms",
];

const NOTIFICATION_TYPES = ["EMAIL", "SMS", "PUSH"];

function getHeaders(token) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomEmail() {
  return `lt_${Date.now()}_${Math.random().toString(36).substring(7)}@loadtest.com`;
}

function randomPhone() {
  return `+447${Math.floor(Math.random() * 900 + 100)}${Math.floor(Math.random() * 9000000 + 1000000)}`;
}

function sendEmailNotification(templateKey, recipient) {
  const payload = JSON.stringify({
    to: recipient || randomEmail(),
    templateKey: templateKey || randomItem(EMAIL_TEMPLATES),
    variables: {
      customerName: "Load Test User",
      orderReference: `LW-2024-${Math.floor(Math.random() * 99999)}`,
      appointmentDate: "2024-12-01",
      appointmentTime: "10:00",
      amount: "£5,999.00",
    },
  });

  const start = Date.now();
  const res = http.post(
    `${BASE_URL}${API_VERSION}/notifications/email`,
    payload,
    {
      headers: getHeaders(AUTH_TOKEN),
      tags: { endpoint: "send_email" },
    }
  );
  sendEmailDuration.add(Date.now() - start);

  const success = check(res, {
    "email sent 200 or 201": (r) => r.status === 200 || r.status === 201,
    "email has message id": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && (body.data.messageId || body.data.id);
      } catch {
        return false;
      }
    },
  });

  if (success) {
    successfulEmails.add(1);
  }

  errorRate.add(!success);
}

function sendSmsNotification(templateKey, recipient) {
  const payload = JSON.stringify({
    to: recipient || randomPhone(),
    templateKey: templateKey || randomItem(SMS_TEMPLATES),
    variables: {
      customerName: "Load Test User",
      appointmentDate: "1st December 2024",
      appointmentTime: "10:00am",
    },
  });

  const start = Date.now();
  const res = http.post(
    `${BASE_URL}${API_VERSION}/notifications/sms`,
    payload,
    {
      headers: getHeaders(AUTH_TOKEN),
      tags: { endpoint: "send_sms" },
    }
  );
  sendSmsDuration.add(Date.now() - start);

  const success = check(res, {
    "sms sent 200 or 201": (r) => r.status === 200 || r.status === 201,
    "sms has message id": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && (body.data.messageId || body.data.id);
      } catch {
        return false;
      }
    },
  });

  if (success) {
    successfulSms.add(1);
  }

  errorRate.add(!success);
}

function listTemplates() {
  const start = Date.now();
  const res = http.get(
    `${BASE_URL}${API_VERSION}/notifications/templates`,
    {
      headers: getHeaders(AUTH_TOKEN),
      tags: { endpoint: "list_templates" },
    }
  );
  templateDuration.add(Date.now() - start);

  const success = check(res, {
    "templates list status 200": (r) => r.status === 200,
    "templates list has data": (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data);
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success);

  if (success) {
    try {
      return JSON.parse(res.body).data || [];
    } catch {
      return [];
    }
  }

  return [];
}

function listNotifications(page) {
  const params = new URLSearchParams({
    page: page || 1,
    limit: 20,
    type: randomItem(NOTIFICATION_TYPES),
  });

  const start = Date.now();
  const res = http.get(
    `${BASE_URL}${API_VERSION}/notifications?${params.toString()}`,
    {
      headers: getHeaders(AUTH_TOKEN),
      tags: { endpoint: "list_notifications" },
    }
  );
  listDuration.add(Date.now() - start);

  const success = check(res, {
    "notifications list status 200": (r) => r.status === 200,
    "notifications list has data": (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data) || Array.isArray(body.data?.items);
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success);
}

function sendBulkEmail(count) {
  const recipients = Array.from({ length: count || 5 }, () => ({
    to: randomEmail(),
    variables: {
      customerName: "Load Test User",
    },
  }));

  const payload = JSON.stringify({
    templateKey: randomItem(EMAIL_TEMPLATES),
    recipients,
  });

  const res = http.post(
    `${BASE_URL}${API_VERSION}/notifications/email/bulk`,
    payload,
    {
      headers: getHeaders(AUTH_TOKEN),
      tags: { endpoint: "bulk_email" },
    }
  );

  check(res, {
    "bulk email accepted 202": (r) => r.status === 202 || r.status === 200,
  });
}

function testInvalidEmailPayload() {
  const res = http.post(
    `${BASE_URL}${API_VERSION}/notifications/email`,
    JSON.stringify({ to: "invalid-email", templateKey: "" }),
    {
      headers: getHeaders(AUTH_TOKEN),
      tags: { endpoint: "email_invalid" },
    }
  );

  check(res, {
    "invalid email returns 400 or 422": (r) => r.status === 400 || r.status === 422,
  });
}

function testUnauthorizedNotification() {
  const res = http.post(
    `${BASE_URL}${API_VERSION}/notifications/email`,
    JSON.stringify({ to: randomEmail(), templateKey: "welcome" }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { endpoint: "notification_unauthorized" },
    }
  );

  check(res, {
    "unauthorized notification returns 401": (r) => r.status === 401,
  });
}

export default function () {
  const scenario = Math.random();

  group("notification_flows", () => {
    if (scenario < 0.35) {
      group("email_flow", () => {
        sendEmailNotification(randomItem(EMAIL_TEMPLATES), randomEmail());
        sleep(0.5);
      });
    } else if (scenario < 0.5) {
      group("sms_flow", () => {
        sendSmsNotification(randomItem(SMS_TEMPLATES), randomPhone());
        sleep(0.5);
      });
    } else if (scenario < 0.65) {
      group("template_and_list", () => {
        listTemplates();
        sleep(0.3);
        listNotifications(1);
        sleep(0.3);
      });
    } else if (scenario < 0.75) {
      group("bulk_email_flow", () => {
        sendBulkEmail(Math.floor(Math.random() * 5) + 2);
        sleep(1);
      });
    } else if (scenario < 0.88) {
      group("mixed_notifications", () => {
        sendEmailNotification("booking_confirmation", randomEmail());
        sleep(0.3);
        sendSmsNotification("booking_confirmation_sms", randomPhone());
        sleep(0.3);
      });
    } else {
      group("error_cases", () => {
        testInvalidEmailPayload();
        sleep(0.3);
        testUnauthorizedNotification();
        sleep(0.3);
      });
    }
  });

  sleep(Math.random() * 2 + 0.5);
}

export function handleSummary(data) {
  return {
    "reports/notification-summary.json": JSON.stringify(data, null, 2),
    stdout: `
Notification Load Test Summary
==============================
Total Requests:         ${data.metrics.http_reqs.values.count}
Failed Requests:        ${data.metrics.http_req_failed.values.passes}
Error Rate:             ${(data.metrics.notification_errors?.values.rate * 100 || 0).toFixed(2)}%
Avg Email Duration:     ${(data.metrics.notification_send_email_duration?.values.avg || 0).toFixed(2)}ms
P95 Email Duration:     ${(data.metrics.notification_send_email_duration?.values["p(95)"] || 0).toFixed(2)}ms
Avg SMS Duration:       ${(data.metrics.notification_send_sms_duration?.values.avg || 0).toFixed(2)}ms
P95 SMS Duration:       ${(data.metrics.notification_send_sms_duration?.values["p(95)"] || 0).toFixed(2)}ms
Emails Sent:            ${data.metrics.notification_emails_sent?.values.count || 0}
SMS Sent:               ${data.metrics.notification_sms_sent?.values.count || 0}
    `,
  };
}