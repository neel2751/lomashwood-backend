import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

const errorRate = new Rate("analytics_errors");
const trackEventDuration = new Trend("analytics_track_event_duration");
const dashboardDuration = new Trend("analytics_dashboard_duration");
const funnelDuration = new Trend("analytics_funnel_duration");
const exportDuration = new Trend("analytics_export_duration");
const eventsTracked = new Counter("analytics_events_tracked");
const batchEventsTracked = new Counter("analytics_batch_events_tracked");

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const API_VERSION = "/v1";
const AUTH_TOKEN = __ENV.AUTH_TOKEN || "";

export const options = {
  scenarios: {
    event_ingestion: {
      executor: "constant-vus",
      vus: 40,
      duration: "2m",
      tags: { scenario: "event_ingestion" },
    },
    dashboard_reads: {
      executor: "constant-vus",
      vus: 15,
      duration: "2m",
      tags: { scenario: "dashboard_reads" },
    },
    ingestion_spike: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "20s", target: 80 },
        { duration: "40s", target: 200 },
        { duration: "20s", target: 80 },
        { duration: "20s", target: 0 },
      ],
      tags: { scenario: "ingestion_spike" },
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<800", "p(99)<2000"],
    http_req_failed: ["rate<0.01"],
    analytics_errors: ["rate<0.03"],
    analytics_track_event_duration: ["p(95)<300"],
    analytics_dashboard_duration: ["p(95)<1000"],
    analytics_funnel_duration: ["p(95)<1500"],
    analytics_export_duration: ["p(95)<3000"],
  },
};

const EVENT_TYPES = [
  "page_view",
  "product_view",
  "add_to_wishlist",
  "appointment_started",
  "appointment_completed",
  "brochure_requested",
  "filter_applied",
  "search_performed",
  "showroom_viewed",
  "finance_page_viewed",
  "contact_form_submitted",
  "newsletter_subscribed",
];

const PAGE_NAMES = [
  "home",
  "kitchens",
  "bedrooms",
  "product_detail",
  "book_appointment",
  "find_showroom",
  "finance",
  "blog",
  "about_us",
  "contact",
  "offers",
];

const DEVICES = ["desktop", "mobile", "tablet"];
const BROWSERS = ["chrome", "safari", "firefox", "edge"];
const SOURCES = ["organic", "paid", "social", "email", "direct", "referral"];
const MEDIUMS = ["cpc", "organic", "social", "email", "none"];
const CAMPAIGNS = ["spring_sale", "bedroom_promo", "kitchen_launch", "retargeting", "brand"];

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

function randomSessionId() {
  return `sess_${Math.random().toString(36).substring(2)}_${Date.now()}`;
}

function randomVisitorId() {
  return `vis_${Math.random().toString(36).substring(2)}`;
}

function buildEventPayload(eventType, sessionId) {
  return {
    eventType: eventType || randomItem(EVENT_TYPES),
    sessionId: sessionId || randomSessionId(),
    visitorId: randomVisitorId(),
    page: randomItem(PAGE_NAMES),
    referrer: Math.random() > 0.5 ? `https://google.com/search?q=kitchen+design` : null,
    device: randomItem(DEVICES),
    browser: randomItem(BROWSERS),
    utmSource: Math.random() > 0.6 ? randomItem(SOURCES) : null,
    utmMedium: Math.random() > 0.6 ? randomItem(MEDIUMS) : null,
    utmCampaign: Math.random() > 0.7 ? randomItem(CAMPAIGNS) : null,
    metadata: {
      productId: Math.random() > 0.5 ? `prod_${Math.random().toString(36).substring(7)}` : null,
      category: Math.random() > 0.5 ? randomItem(["KITCHEN", "BEDROOM"]) : null,
      searchQuery: eventType === "search_performed" ? randomItem(["modern kitchen", "fitted bedroom", "handleless"]) : null,
      filterApplied: eventType === "filter_applied" ? { style: "Modern", finish: "Gloss" } : null,
    },
    timestamp: new Date().toISOString(),
  };
}

function trackEvent(eventType, sessionId) {
  const payload = JSON.stringify(buildEventPayload(eventType, sessionId));

  const start = Date.now();
  const res = http.post(
    `${BASE_URL}${API_VERSION}/analytics/track`,
    payload,
    {
      headers: getHeaders(AUTH_TOKEN),
      tags: { endpoint: "track_event" },
    }
  );
  trackEventDuration.add(Date.now() - start);

  const success = check(res, {
    "event tracked 200 or 201": (r) => r.status === 200 || r.status === 201,
    "event tracking accepted": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success || (body.data && body.data.id);
      } catch {
        return false;
      }
    },
  });

  if (success) {
    eventsTracked.add(1);
  }

  errorRate.add(!success);
}

function trackBatchEvents(count) {
  const sessionId = randomSessionId();
  const events = Array.from({ length: count || 5 }, (_, i) => ({
    ...buildEventPayload(randomItem(EVENT_TYPES), sessionId),
    sequenceNumber: i + 1,
  }));

  const payload = JSON.stringify({ events });

  const res = http.post(
    `${BASE_URL}${API_VERSION}/analytics/track/batch`,
    payload,
    {
      headers: getHeaders(AUTH_TOKEN),
      tags: { endpoint: "track_batch" },
    }
  );

  const success = check(res, {
    "batch events accepted 200 or 202": (r) => r.status === 200 || r.status === 201 || r.status === 202,
  });

  if (success) {
    batchEventsTracked.add(count || 5);
  }

  errorRate.add(!success);
}

function getDashboard(dashboardType) {
  const params = new URLSearchParams({
    type: dashboardType || "overview",
    period: randomItem(["day", "week", "month", "quarter"]),
    from: "2024-01-01",
    to: new Date().toISOString().split("T")[0],
  });

  const start = Date.now();
  const res = http.get(
    `${BASE_URL}${API_VERSION}/analytics/dashboards?${params.toString()}`,
    {
      headers: getHeaders(AUTH_TOKEN),
      tags: { endpoint: "get_dashboard" },
    }
  );
  dashboardDuration.add(Date.now() - start);

  const success = check(res, {
    "dashboard status 200": (r) => r.status === 200,
    "dashboard has metrics": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && typeof body.data === "object";
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success);
}

function getFunnelAnalysis(funnelType) {
  const params = new URLSearchParams({
    funnel: funnelType || randomItem(["checkout", "booking", "brochure"]),
    period: randomItem(["week", "month"]),
    from: "2024-01-01",
    to: new Date().toISOString().split("T")[0],
  });

  const start = Date.now();
  const res = http.get(
    `${BASE_URL}${API_VERSION}/analytics/funnels?${params.toString()}`,
    {
      headers: getHeaders(AUTH_TOKEN),
      tags: { endpoint: "get_funnel" },
    }
  );
  funnelDuration.add(Date.now() - start);

  const success = check(res, {
    "funnel status 200": (r) => r.status === 200,
    "funnel has steps": (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data?.steps) || Array.isArray(body.data);
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success);
}

function exportReport(format) {
  const payload = JSON.stringify({
    type: randomItem(["events", "sessions", "conversions"]),
    format: format || randomItem(["csv", "json"]),
    from: "2024-01-01",
    to: new Date().toISOString().split("T")[0],
    filters: {
      device: randomItem(DEVICES),
    },
  });

  const start = Date.now();
  const res = http.post(
    `${BASE_URL}${API_VERSION}/analytics/exports`,
    payload,
    {
      headers: getHeaders(AUTH_TOKEN),
      tags: { endpoint: "export_report" },
    }
  );
  exportDuration.add(Date.now() - start);

  const success = check(res, {
    "export accepted 200 or 202": (r) => r.status === 200 || r.status === 202,
    "export has job id": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && (body.data.jobId || body.data.id || body.data.url);
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success);
}

function simulateUserSession() {
  const sessionId = randomSessionId();

  trackEvent("page_view", sessionId);
  sleep(Math.random() * 2 + 1);

  trackEvent("product_view", sessionId);
  sleep(Math.random() * 3 + 2);

  if (Math.random() > 0.6) {
    trackEvent("add_to_wishlist", sessionId);
    sleep(Math.random() * 2 + 1);
  }

  if (Math.random() > 0.5) {
    trackEvent("appointment_started", sessionId);
    sleep(Math.random() * 5 + 3);

    if (Math.random() > 0.6) {
      trackEvent("appointment_completed", sessionId);
    }
  }
}

function testInvalidEventPayload() {
  const res = http.post(
    `${BASE_URL}${API_VERSION}/analytics/track`,
    JSON.stringify({ eventType: "" }),
    {
      headers: getHeaders(AUTH_TOKEN),
      tags: { endpoint: "event_invalid" },
    }
  );

  check(res, {
    "invalid event returns 400 or 422": (r) => r.status === 400 || r.status === 422,
  });
}

export default function () {
  const scenario = Math.random();

  group("analytics_flows", () => {
    if (scenario < 0.4) {
      group("event_tracking", () => {
        trackEvent(randomItem(EVENT_TYPES), randomSessionId());
        sleep(0.2);
      });
    } else if (scenario < 0.55) {
      group("batch_tracking", () => {
        const batchSize = Math.floor(Math.random() * 8) + 3;
        trackBatchEvents(batchSize);
        sleep(0.5);
      });
    } else if (scenario < 0.65) {
      group("user_session_simulation", () => {
        simulateUserSession();
      });
    } else if (scenario < 0.75) {
      group("dashboard_reads", () => {
        getDashboard("overview");
        sleep(0.5);
        getDashboard("acquisition");
        sleep(0.5);
      });
    } else if (scenario < 0.85) {
      group("funnel_analysis", () => {
        getFunnelAnalysis("checkout");
        sleep(0.5);
        getFunnelAnalysis("booking");
        sleep(0.5);
      });
    } else if (scenario < 0.93) {
      group("report_export", () => {
        exportReport("csv");
        sleep(1);
      });
    } else {
      group("error_cases", () => {
        testInvalidEventPayload();
        sleep(0.3);
      });
    }
  });

  sleep(Math.random() * 1 + 0.2);
}

export function handleSummary(data) {
  return {
    "reports/analytics-summary.json": JSON.stringify(data, null, 2),
    stdout: `
Analytics Load Test Summary
===========================
Total Requests:          ${data.metrics.http_reqs.values.count}
Failed Requests:         ${data.metrics.http_req_failed.values.passes}
Error Rate:              ${(data.metrics.analytics_errors?.values.rate * 100 || 0).toFixed(2)}%
Avg Event Track:         ${(data.metrics.analytics_track_event_duration?.values.avg || 0).toFixed(2)}ms
P95 Event Track:         ${(data.metrics.analytics_track_event_duration?.values["p(95)"] || 0).toFixed(2)}ms
Avg Dashboard:           ${(data.metrics.analytics_dashboard_duration?.values.avg || 0).toFixed(2)}ms
P95 Dashboard:           ${(data.metrics.analytics_dashboard_duration?.values["p(95)"] || 0).toFixed(2)}ms
Events Tracked:          ${data.metrics.analytics_events_tracked?.values.count || 0}
Batch Events Tracked:    ${data.metrics.analytics_batch_events_tracked?.values.count || 0}
    `,
  };
}