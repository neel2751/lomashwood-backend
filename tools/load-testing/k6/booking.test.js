import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

const errorRate = new Rate("booking_errors");
const availabilityDuration = new Trend("booking_availability_duration");
const createDuration = new Trend("booking_create_duration");
const detailDuration = new Trend("booking_detail_duration");
const brochureDuration = new Trend("booking_brochure_duration");
const businessDuration = new Trend("booking_business_duration");
const successfulBookings = new Counter("booking_successful_bookings");
const successfulBrochures = new Counter("booking_successful_brochures");

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const API_VERSION = "/v1";
const AUTH_TOKEN = __ENV.AUTH_TOKEN || "";

export const options = {
  scenarios: {
    normal_load: {
      executor: "constant-vus",
      vus: 15,
      duration: "2m",
      tags: { scenario: "normal_load" },
    },
    burst: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "20s", target: 30 },
        { duration: "40s", target: 80 },
        { duration: "20s", target: 30 },
        { duration: "20s", target: 0 },
      ],
      tags: { scenario: "burst" },
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<1000", "p(99)<2000"],
    http_req_failed: ["rate<0.01"],
    booking_errors: ["rate<0.05"],
    booking_availability_duration: ["p(95)<500"],
    booking_create_duration: ["p(95)<800"],
    booking_detail_duration: ["p(95)<300"],
    booking_brochure_duration: ["p(95)<600"],
  },
};

const APPOINTMENT_TYPES = ["HOME_MEASUREMENT", "ONLINE", "SHOWROOM"];
const UK_POSTCODES = ["SW1A 1AA", "EC1A 1BB", "M1 1AE", "B1 1BB", "LS1 1BA", "E1 6AN"];
const UK_CITIES = ["London", "Manchester", "Birmingham", "Leeds", "Bristol"];
const BUSINESS_TYPES = ["Builder", "Contractor", "Interior Designer", "Developer", "Architect"];
const TIME_SLOTS = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00"];

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

function randomFutureDate(daysAhead) {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * daysAhead) + 1);
  return date.toISOString().split("T")[0];
}

function randomPhone() {
  return `07${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 900000 + 100000)}`;
}

function randomEmail() {
  return `lt_${Date.now()}_${Math.random().toString(36).substring(7)}@loadtest.com`;
}

function randomName() {
  const firstNames = ["James", "Sarah", "Michael", "Emma", "David", "Claire", "Robert", "Rachel"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Taylor", "Davies", "Wilson", "Evans"];
  return `${randomItem(firstNames)} ${randomItem(lastNames)}`;
}

function getAvailability(date) {
  const params = new URLSearchParams({
    date: date || randomFutureDate(30),
    type: randomItem(APPOINTMENT_TYPES),
  });

  const start = Date.now();
  const res = http.get(
    `${BASE_URL}${API_VERSION}/appointments/availability?${params.toString()}`,
    {
      headers: getHeaders(AUTH_TOKEN),
      tags: { endpoint: "availability" },
    }
  );
  availabilityDuration.add(Date.now() - start);

  const success = check(res, {
    "availability status 200": (r) => r.status === 200,
    "availability returns slots": (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data) || Array.isArray(body.data?.slots);
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success);

  if (success) {
    try {
      const body = JSON.parse(res.body);
      return body.data?.slots || body.data || [];
    } catch {
      return [];
    }
  }

  return [];
}

function createAppointment(appointmentData) {
  const payload = JSON.stringify({
    appointmentType: appointmentData.type || randomItem(APPOINTMENT_TYPES),
    forKitchen: Math.random() > 0.4,
    forBedroom: Math.random() > 0.4,
    appointmentDate: appointmentData.date || randomFutureDate(30),
    timeSlot: appointmentData.slot || randomItem(TIME_SLOTS),
    customerName: appointmentData.name || randomName(),
    customerEmail: appointmentData.email || randomEmail(),
    customerPhone: appointmentData.phone || randomPhone(),
    customerPostcode: randomItem(UK_POSTCODES),
    customerAddress: `${Math.floor(Math.random() * 200) + 1} Test Street, ${randomItem(UK_CITIES)}`,
  });

  const start = Date.now();
  const res = http.post(
    `${BASE_URL}${API_VERSION}/appointments`,
    payload,
    {
      headers: getHeaders(AUTH_TOKEN),
      tags: { endpoint: "create_appointment" },
    }
  );
  createDuration.add(Date.now() - start);

  const success = check(res, {
    "appointment created 201": (r) => r.status === 201,
    "appointment has id": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.id;
      } catch {
        return false;
      }
    },
  });

  if (success) {
    successfulBookings.add(1);
    try {
      return JSON.parse(res.body).data.id;
    } catch {
      return null;
    }
  }

  errorRate.add(!success);
  return null;
}

function getAppointment(appointmentId) {
  if (!appointmentId) return;

  const start = Date.now();
  const res = http.get(
    `${BASE_URL}${API_VERSION}/appointments/${appointmentId}`,
    {
      headers: getHeaders(AUTH_TOKEN),
      tags: { endpoint: "get_appointment" },
    }
  );
  detailDuration.add(Date.now() - start);

  const success = check(res, {
    "appointment detail status 200": (r) => r.status === 200,
    "appointment detail has status": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.status;
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success);
}

function requestBrochure() {
  const payload = JSON.stringify({
    name: randomName(),
    email: randomEmail(),
    phone: randomPhone(),
    postcode: randomItem(UK_POSTCODES),
    address: `${Math.floor(Math.random() * 200) + 1} Load Test Avenue, ${randomItem(UK_CITIES)}`,
  });

  const start = Date.now();
  const res = http.post(
    `${BASE_URL}${API_VERSION}/brochures`,
    payload,
    {
      headers: getHeaders(AUTH_TOKEN),
      tags: { endpoint: "brochure_request" },
    }
  );
  brochureDuration.add(Date.now() - start);

  const success = check(res, {
    "brochure request 201": (r) => r.status === 201,
    "brochure request has id": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.id;
      } catch {
        return false;
      }
    },
  });

  if (success) {
    successfulBrochures.add(1);
  }

  errorRate.add(!success);
}

function submitBusinessInquiry() {
  const payload = JSON.stringify({
    name: randomName(),
    email: randomEmail(),
    phone: randomPhone(),
    businessType: randomItem(BUSINESS_TYPES),
    message: "Load test business inquiry message.",
  });

  const start = Date.now();
  const res = http.post(
    `${BASE_URL}${API_VERSION}/business`,
    payload,
    {
      headers: getHeaders(AUTH_TOKEN),
      tags: { endpoint: "business_inquiry" },
    }
  );
  businessDuration.add(Date.now() - start);

  const success = check(res, {
    "business inquiry 201": (r) => r.status === 201,
  });

  errorRate.add(!success);
}

function subscribeNewsletter() {
  const payload = JSON.stringify({
    email: randomEmail(),
  });

  const res = http.post(
    `${BASE_URL}${API_VERSION}/newsletter`,
    payload,
    {
      headers: getHeaders(AUTH_TOKEN),
      tags: { endpoint: "newsletter" },
    }
  );

  check(res, {
    "newsletter subscribe 201": (r) => r.status === 201,
    "newsletter duplicate handled": (r) => r.status === 201 || r.status === 409,
  });
}

function getShowrooms() {
  const res = http.get(`${BASE_URL}${API_VERSION}/showrooms`, {
    headers: getHeaders(AUTH_TOKEN),
    tags: { endpoint: "showrooms" },
  });

  check(res, {
    "showrooms status 200": (r) => r.status === 200,
    "showrooms has data": (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data);
      } catch {
        return false;
      }
    },
  });
}

function testValidationErrors() {
  const invalidPayload = JSON.stringify({
    appointmentType: "INVALID_TYPE",
    forKitchen: false,
    forBedroom: false,
  });

  const res = http.post(
    `${BASE_URL}${API_VERSION}/appointments`,
    invalidPayload,
    {
      headers: getHeaders(AUTH_TOKEN),
      tags: { endpoint: "appointment_invalid" },
    }
  );

  check(res, {
    "invalid appointment returns 422": (r) => r.status === 422 || r.status === 400,
  });
}

export default function () {
  const scenario = Math.random();

  group("booking_flows", () => {
    if (scenario < 0.35) {
      group("full_booking_flow", () => {
        getShowrooms();
        sleep(0.5);

        const date = randomFutureDate(30);
        getAvailability(date);
        sleep(1);

        const appointmentId = createAppointment({ date });
        sleep(0.5);

        if (appointmentId) {
          getAppointment(appointmentId);
        }
      });
    } else if (scenario < 0.55) {
      group("brochure_flow", () => {
        requestBrochure();
        sleep(0.5);
      });
    } else if (scenario < 0.7) {
      group("business_inquiry_flow", () => {
        submitBusinessInquiry();
        sleep(0.5);
      });
    } else if (scenario < 0.85) {
      group("newsletter_flow", () => {
        subscribeNewsletter();
        sleep(0.3);
      });
    } else if (scenario < 0.95) {
      group("availability_check", () => {
        for (let i = 0; i < 3; i++) {
          getAvailability(randomFutureDate(60));
          sleep(0.5);
        }
      });
    } else {
      group("validation_errors", () => {
        testValidationErrors();
        sleep(0.5);
      });
    }
  });

  sleep(Math.random() * 2 + 0.5);
}

export function handleSummary(data) {
  return {
    "reports/booking-summary.json": JSON.stringify(data, null, 2),
    stdout: `
Booking Load Test Summary
=========================
Total Requests:           ${data.metrics.http_reqs.values.count}
Failed Requests:          ${data.metrics.http_req_failed.values.passes}
Error Rate:               ${(data.metrics.booking_errors?.values.rate * 100 || 0).toFixed(2)}%
Avg Availability:         ${(data.metrics.booking_availability_duration?.values.avg || 0).toFixed(2)}ms
P95 Availability:         ${(data.metrics.booking_availability_duration?.values["p(95)"] || 0).toFixed(2)}ms
Avg Create Duration:      ${(data.metrics.booking_create_duration?.values.avg || 0).toFixed(2)}ms
P95 Create Duration:      ${(data.metrics.booking_create_duration?.values["p(95)"] || 0).toFixed(2)}ms
Successful Bookings:      ${data.metrics.booking_successful_bookings?.values.count || 0}
Successful Brochures:     ${data.metrics.booking_successful_brochures?.values.count || 0}
    `,
  };
}