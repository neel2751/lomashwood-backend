import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

const errorRate = new Rate("auth_errors");
const loginDuration = new Trend("auth_login_duration");
const registerDuration = new Trend("auth_register_duration");
const meDuration = new Trend("auth_me_duration");
const successfulLogins = new Counter("auth_successful_logins");

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const API_VERSION = "/v1";

export const options = {
  scenarios: {
    baseline: {
      executor: "constant-vus",
      vus: 10,
      duration: "1m",
      tags: { scenario: "baseline" },
    },
    ramp_up: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 20 },
        { duration: "1m", target: 50 },
        { duration: "30s", target: 100 },
        { duration: "1m", target: 100 },
        { duration: "30s", target: 0 },
      ],
      tags: { scenario: "ramp_up" },
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<1000"],
    http_req_failed: ["rate<0.01"],
    auth_errors: ["rate<0.05"],
    auth_login_duration: ["p(95)<300"],
    auth_register_duration: ["p(95)<400"],
    auth_me_duration: ["p(95)<200"],
  },
};

const TEST_USERS = [
  { email: "admin@lomashwood.co.uk", password: "Admin@LomashWood2024!" },
  { email: "staff@lomashwood.co.uk", password: "Staff@LomashWood2024!" },
];

function generateEmail() {
  return `loadtest_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`;
}

function generatePassword() {
  return "LoadTest@1234!";
}

function getHeaders(token) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function login(email, password) {
  const payload = JSON.stringify({ email, password });
  const start = Date.now();

  const res = http.post(`${BASE_URL}${API_VERSION}/auth/login`, payload, {
    headers: getHeaders(),
    tags: { endpoint: "login" },
  });

  loginDuration.add(Date.now() - start);

  const success = check(res, {
    "login status 200": (r) => r.status === 200,
    "login returns token": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.token;
      } catch {
        return false;
      }
    },
  });

  if (success) {
    successfulLogins.add(1);
    try {
      return JSON.parse(res.body).data.token;
    } catch {
      return null;
    }
  }

  errorRate.add(!success);
  return null;
}

function register(email, password) {
  const payload = JSON.stringify({
    email,
    password,
    name: "Load Test User",
  });

  const start = Date.now();

  const res = http.post(`${BASE_URL}${API_VERSION}/auth/register`, payload, {
    headers: getHeaders(),
    tags: { endpoint: "register" },
  });

  registerDuration.add(Date.now() - start);

  const success = check(res, {
    "register status 201": (r) => r.status === 201,
    "register returns user": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.user;
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success);
  return success;
}

function getMe(token) {
  const start = Date.now();

  const res = http.get(`${BASE_URL}${API_VERSION}/auth/me`, {
    headers: getHeaders(token),
    tags: { endpoint: "me" },
  });

  meDuration.add(Date.now() - start);

  const success = check(res, {
    "me status 200": (r) => r.status === 200,
    "me returns user": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.email;
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success);
}

function logout(token) {
  const res = http.post(
    `${BASE_URL}${API_VERSION}/auth/logout`,
    null,
    {
      headers: getHeaders(token),
      tags: { endpoint: "logout" },
    }
  );

  check(res, {
    "logout status 200": (r) => r.status === 200,
  });
}

function testInvalidLogin() {
  const res = http.post(
    `${BASE_URL}${API_VERSION}/auth/login`,
    JSON.stringify({ email: "invalid@test.com", password: "wrongpassword" }),
    { headers: getHeaders(), tags: { endpoint: "login_invalid" } }
  );

  check(res, {
    "invalid login returns 401": (r) => r.status === 401,
  });
}

function testUnauthorizedAccess() {
  const res = http.get(`${BASE_URL}${API_VERSION}/auth/me`, {
    headers: getHeaders(),
    tags: { endpoint: "me_unauthorized" },
  });

  check(res, {
    "unauthorized me returns 401": (r) => r.status === 401,
  });
}

export default function () {
  const vuId = __VU % TEST_USERS.length;
  const testUser = TEST_USERS[vuId];

  group("auth_flow", () => {
    group("login_flow", () => {
      const token = login(testUser.email, testUser.password);

      if (token) {
        sleep(0.5);

        group("authenticated_requests", () => {
          getMe(token);
          sleep(0.3);
          getMe(token);
          sleep(0.3);
        });

        sleep(0.5);
        logout(token);
      }

      sleep(1);
    });

    group("error_flows", () => {
      testInvalidLogin();
      sleep(0.5);
      testUnauthorizedAccess();
      sleep(0.5);
    });

    if (__ITER % 10 === 0) {
      group("register_flow", () => {
        const email = generateEmail();
        const password = generatePassword();
        register(email, password);
        sleep(0.5);

        const token = login(email, password);
        if (token) {
          getMe(token);
          sleep(0.3);
          logout(token);
        }
      });
    }
  });

  sleep(Math.random() * 2 + 1);
}

export function handleSummary(data) {
  return {
    "reports/auth-summary.json": JSON.stringify(data, null, 2),
    stdout: `
Auth Load Test Summary
======================
Total Requests:     ${data.metrics.http_reqs.values.count}
Failed Requests:    ${data.metrics.http_req_failed.values.passes}
Error Rate:         ${(data.metrics.auth_errors?.values.rate * 100 || 0).toFixed(2)}%
Avg Login Duration: ${(data.metrics.auth_login_duration?.values.avg || 0).toFixed(2)}ms
P95 Login Duration: ${(data.metrics.auth_login_duration?.values["p(95)"] || 0).toFixed(2)}ms
Successful Logins:  ${data.metrics.auth_successful_logins?.values.count || 0}
    `,
  };
}