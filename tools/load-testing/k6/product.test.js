import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

const errorRate = new Rate("product_errors");
const listDuration = new Trend("product_list_duration");
const detailDuration = new Trend("product_detail_duration");
const filterDuration = new Trend("product_filter_duration");
const searchDuration = new Trend("product_search_duration");
const cacheHits = new Counter("product_cache_hits");

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const API_VERSION = "/v1";
const AUTH_TOKEN = __ENV.AUTH_TOKEN || "";

export const options = {
  scenarios: {
    browse_products: {
      executor: "constant-vus",
      vus: 30,
      duration: "2m",
      tags: { scenario: "browse_products" },
    },
    spike_browse: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 50 },
        { duration: "1m", target: 200 },
        { duration: "30s", target: 50 },
        { duration: "30s", target: 0 },
      ],
      tags: { scenario: "spike_browse" },
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<800", "p(99)<1500"],
    http_req_failed: ["rate<0.01"],
    product_errors: ["rate<0.05"],
    product_list_duration: ["p(95)<600"],
    product_detail_duration: ["p(95)<400"],
    product_filter_duration: ["p(95)<800"],
    product_search_duration: ["p(95)<600"],
  },
};

const CATEGORIES = ["kitchen", "bedroom"];
const STYLES = ["Modern", "Classic", "Shaker", "Handleless", "In-Frame", "Contemporary"];
const FINISHES = ["Gloss", "Matt", "Silk", "Textured"];
const COLOURS = ["Pebble Grey", "Ivory White", "Anthracite Grey", "Cashmere", "Soft White"];
const RANGES = ["Lucia", "Belgravia", "Malton", "Cassia", "Caraway"];
const SORT_OPTIONS = ["price_asc", "price_desc", "newest", "popularity"];
const PAGE_SIZES = [12, 24, 36];

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

function checkCacheHeader(res) {
  const cacheControl = res.headers["X-Cache"] || res.headers["x-cache"];
  if (cacheControl && cacheControl.includes("HIT")) {
    cacheHits.add(1);
  }
}

function listProducts(category, params) {
  const queryParams = new URLSearchParams({
    category: category || randomItem(CATEGORIES),
    page: params?.page || 1,
    limit: params?.limit || randomItem(PAGE_SIZES),
    ...(params?.style && { style: params.style }),
    ...(params?.finish && { finish: params.finish }),
    ...(params?.colour && { colour: params.colour }),
    ...(params?.range && { range: params.range }),
    ...(params?.sort && { sort: params.sort }),
  });

  const start = Date.now();
  const res = http.get(
    `${BASE_URL}${API_VERSION}/products?${queryParams.toString()}`,
    {
      headers: getHeaders(AUTH_TOKEN),
      tags: { endpoint: "product_list" },
    }
  );
  listDuration.add(Date.now() - start);
  checkCacheHeader(res);

  const success = check(res, {
    "product list status 200": (r) => r.status === 200,
    "product list has data": (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data) || Array.isArray(body.data?.items);
      } catch {
        return false;
      }
    },
    "product list has pagination": (r) => {
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

function getProductDetail(productId) {
  if (!productId) return;

  const start = Date.now();
  const res = http.get(`${BASE_URL}${API_VERSION}/products/${productId}`, {
    headers: getHeaders(AUTH_TOKEN),
    tags: { endpoint: "product_detail" },
  });
  detailDuration.add(Date.now() - start);
  checkCacheHeader(res);

  const success = check(res, {
    "product detail status 200": (r) => r.status === 200,
    "product detail has title": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.title;
      } catch {
        return false;
      }
    },
    "product detail has images": (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data?.images);
      } catch {
        return false;
      }
    },
    "product detail has colours": (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data?.colours);
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!success);
}

function filterProducts() {
  const queryParams = new URLSearchParams({
    category: randomItem(CATEGORIES),
    style: randomItem(STYLES),
    finish: randomItem(FINISHES),
    colour: randomItem(COLOURS),
    sort: randomItem(SORT_OPTIONS),
    page: 1,
    limit: 24,
  });

  const start = Date.now();
  const res = http.get(
    `${BASE_URL}${API_VERSION}/products?${queryParams.toString()}`,
    {
      headers: getHeaders(AUTH_TOKEN),
      tags: { endpoint: "product_filter" },
    }
  );
  filterDuration.add(Date.now() - start);

  const success = check(res, {
    "filtered products status 200": (r) => r.status === 200,
    "filtered products returns array": (r) => {
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

function searchProducts(query) {
  const queryParams = new URLSearchParams({
    q: query || randomItem(RANGES),
    category: randomItem(CATEGORIES),
    limit: 12,
  });

  const start = Date.now();
  const res = http.get(
    `${BASE_URL}${API_VERSION}/products/search?${queryParams.toString()}`,
    {
      headers: getHeaders(AUTH_TOKEN),
      tags: { endpoint: "product_search" },
    }
  );
  searchDuration.add(Date.now() - start);

  const success = check(res, {
    "product search status 200": (r) => r.status === 200,
  });

  errorRate.add(!success);
}

function getNotFoundProduct() {
  const res = http.get(
    `${BASE_URL}${API_VERSION}/products/nonexistent-product-id-999`,
    {
      headers: getHeaders(AUTH_TOKEN),
      tags: { endpoint: "product_not_found" },
    }
  );

  check(res, {
    "not found product returns 404": (r) => r.status === 404,
  });
}

function infiniteScrollSimulation(category) {
  for (let page = 1; page <= 3; page++) {
    listProducts(category, { page, limit: 24 });
    sleep(0.8);
  }
}

export default function () {
  const category = randomItem(CATEGORIES);
  const scenario = Math.random();

  group("product_browsing", () => {
    if (scenario < 0.4) {
      group("list_and_detail", () => {
        const products = listProducts(category);
        sleep(1);

        if (products.length > 0) {
          const product = products[Math.floor(Math.random() * products.length)];
          getProductDetail(product.id || product.slug);
          sleep(2);
        }
      });
    } else if (scenario < 0.65) {
      group("filter_browse", () => {
        filterProducts();
        sleep(1.5);

        const products = listProducts(category, {
          style: randomItem(STYLES),
          sort: randomItem(SORT_OPTIONS),
        });

        if (products.length > 0) {
          const product = products[0];
          getProductDetail(product.id || product.slug);
          sleep(1);
        }
      });
    } else if (scenario < 0.8) {
      group("infinite_scroll", () => {
        infiniteScrollSimulation(category);
      });
    } else if (scenario < 0.9) {
      group("search_flow", () => {
        searchProducts(randomItem(RANGES));
        sleep(1);
        searchProducts(randomItem(STYLES));
        sleep(1);
      });
    } else {
      group("error_cases", () => {
        getNotFoundProduct();
        sleep(0.5);
      });
    }
  });

  sleep(Math.random() * 3 + 1);
}

export function handleSummary(data) {
  return {
    "reports/product-summary.json": JSON.stringify(data, null, 2),
    stdout: `
Product Load Test Summary
=========================
Total Requests:        ${data.metrics.http_reqs.values.count}
Failed Requests:       ${data.metrics.http_req_failed.values.passes}
Error Rate:            ${(data.metrics.product_errors?.values.rate * 100 || 0).toFixed(2)}%
Avg List Duration:     ${(data.metrics.product_list_duration?.values.avg || 0).toFixed(2)}ms
P95 List Duration:     ${(data.metrics.product_list_duration?.values["p(95)"] || 0).toFixed(2)}ms
Avg Detail Duration:   ${(data.metrics.product_detail_duration?.values.avg || 0).toFixed(2)}ms
P95 Detail Duration:   ${(data.metrics.product_detail_duration?.values["p(95)"] || 0).toFixed(2)}ms
Avg Filter Duration:   ${(data.metrics.product_filter_duration?.values.avg || 0).toFixed(2)}ms
Cache Hits:            ${data.metrics.product_cache_hits?.values.count || 0}
    `,
  };
}