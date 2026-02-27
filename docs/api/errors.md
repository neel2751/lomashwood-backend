# API Errors Reference

---

## Overview

All error responses from the Lomash Wood API follow a consistent JSON structure. Errors originate at the api-gateway (auth, rate limiting, routing) or from individual microservices (business logic, validation). The `requestId` field in every response enables cross-service trace correlation in the observability stack.

---

## Error Response Structure

### Standard Error

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Product not found",
  "code": "PRODUCT_NOT_FOUND",
  "requestId": "uuid"
}
```

| Field | Type | Description |
|---|---|---|
| `statusCode` | integer | HTTP status code |
| `error` | string | HTTP status text |
| `message` | string | Human-readable description |
| `code` | string | Machine-readable error code |
| `requestId` | string | Unique request ID for trace lookup |

### Validation Error

Returned when the request body fails Zod schema validation.

```json
{
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "issues": [
    {
      "field": "email",
      "message": "Invalid email address"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ],
  "requestId": "uuid"
}
```

---

## HTTP Status Codes

| Status Code | Meaning | When Used |
|---|---|---|
| 200 | OK | Successful GET, PATCH |
| 201 | Created | Successful POST (resource created) |
| 202 | Accepted | Async operation queued (e.g., analytics track, export) |
| 204 | No Content | Successful DELETE or logout |
| 400 | Bad Request | Malformed request, business rule violation |
| 401 | Unauthorized | Missing, expired, or invalid JWT |
| 403 | Forbidden | Valid token but insufficient role/ownership |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Duplicate resource or state conflict |
| 413 | Payload Too Large | File upload exceeds size limit |
| 422 | Unprocessable Entity | Request body failed schema validation |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |
| 502 | Bad Gateway | Upstream microservice unreachable |
| 503 | Service Unavailable | Service temporarily unavailable |

---

## Error Codes Reference

### Auth Errors

| Code | Status | Description |
|---|---|---|
| `UNAUTHORIZED` | 401 | No token provided or token is expired |
| `TOKEN_BLACKLISTED` | 401 | Token has been revoked (post-logout) |
| `INVALID_CREDENTIALS` | 401 | Email/password combination incorrect |
| `ACCOUNT_DEACTIVATED` | 401 | User account has been deactivated |
| `FORBIDDEN` | 403 | Authenticated but insufficient permissions |
| `EMAIL_TAKEN` | 409 | Email already registered |

### Product Errors

| Code | Status | Description |
|---|---|---|
| `PRODUCT_NOT_FOUND` | 404 | No product with the given ID |
| `PRODUCT_UNAVAILABLE` | 400 | Product is inactive or out of stock |
| `COLOUR_NOT_FOUND` | 404 | Referenced colour ID does not exist |
| `CATEGORY_NOT_FOUND` | 404 | Referenced category does not exist |

### Appointment Errors

| Code | Status | Description |
|---|---|---|
| `SLOT_UNAVAILABLE` | 409 | Time slot was booked concurrently |
| `SLOT_NOT_FOUND` | 404 | Referenced slot ID does not exist |
| `APPOINTMENT_NOT_FOUND` | 404 | No appointment with the given ID |
| `SHOWROOM_NOT_FOUND` | 404 | No showroom with the given ID |
| `NO_CATEGORY_SELECTED` | 422 | Both forKitchen and forBedroom are false |
| `CANCELLATION_WINDOW_EXPIRED` | 400 | Cancellation attempted less than 2 hours before appointment |

### Order Errors

| Code | Status | Description |
|---|---|---|
| `ORDER_NOT_FOUND` | 404 | No order with the given ID |
| `ORDER_NOT_CANCELLABLE` | 400 | Order status does not allow cancellation |
| `INSUFFICIENT_STOCK` | 400 | Ordered quantity exceeds available stock |
| `PRICE_MISMATCH` | 400 | Product price changed since cart was created |

### Payment Errors

| Code | Status | Description |
|---|---|---|
| `PAYMENT_INTENT_FAILED` | 400 | Stripe rejected the payment intent creation |
| `INVALID_STRIPE_SIGNATURE` | 400 | Webhook signature verification failed |
| `PAYMENT_NOT_FOUND` | 404 | No payment transaction with the given ID |
| `REFUND_FAILED` | 400 | Stripe refund creation failed |

### Content Errors

| Code | Status | Description |
|---|---|---|
| `BLOG_NOT_FOUND` | 404 | No published blog post with the given slug |
| `PAGE_NOT_FOUND` | 404 | No CMS page with the given slug |
| `SLUG_TAKEN` | 409 | Blog post slug already exists |
| `INVALID_FILE_TYPE` | 400 | Uploaded file MIME type not permitted |
| `FILE_TOO_LARGE` | 413 | Uploaded file exceeds 50MB limit |
| `MEDIA_NOT_FOUND` | 404 | No media asset with the given ID |

### Customer Errors

| Code | Status | Description |
|---|---|---|
| `CUSTOMER_NOT_FOUND` | 404 | No customer with the given ID |
| `ALREADY_IN_WISHLIST` | 409 | Product already exists in wishlist |
| `ALREADY_SUBSCRIBED` | 409 | Email already on newsletter list |
| `REVIEW_NOT_FOUND` | 404 | No review with the given ID |

### Analytics Errors

| Code | Status | Description |
|---|---|---|
| `EXPORT_NOT_FOUND` | 404 | No export with the given ID |
| `EXPORT_NOT_READY` | 400 | Export is still processing |
| `INVALID_EVENT_TYPE` | 422 | Unrecognised tracking event type |

### Infrastructure Errors

| Code | Status | Description |
|---|---|---|
| `RATE_LIMITED` | 429 | Too many requests from this IP |
| `SERVICE_UNAVAILABLE` | 503 | Microservice is temporarily offline |
| `UPSTREAM_ERROR` | 502 | Error communicating with an internal service |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Rate Limiting Errors

When the rate limit is exceeded, the response includes additional headers:

```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1706789400
Retry-After: 847
```

```json
{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please retry after 847 seconds.",
  "code": "RATE_LIMITED",
  "requestId": "uuid"
}
```

---

## Validation Error Detail

The `issues` array in a `422` response maps directly to Zod's `ZodError.issues` output, normalised to field paths:

```json
{
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "issues": [
    {
      "field": "customerDetails.email",
      "message": "Invalid email address"
    },
    {
      "field": "items",
      "message": "Array must contain at least 1 element(s)"
    }
  ],
  "requestId": "uuid"
}
```

Nested fields use dot notation (`customerDetails.email`). Array field errors include the index where relevant (`items[0].productId`).

---

## Server Errors

`500 Internal Server Error` responses do not expose stack traces or internal error messages in production:

```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred. Please try again or contact support.",
  "code": "INTERNAL_ERROR",
  "requestId": "uuid"
}
```

The `requestId` allows the engineering team to look up the full error details, including stack trace, in Loki (structured logs) and Sentry (error tracking) using the request ID as the search key.

---

## Error Handling in the API Gateway

The api-gateway's global `error.middleware.ts` catches all unhandled errors from the proxy layer and formats them consistently before returning to the client. Errors from internal services are forwarded as-is if they conform to the standard error schema, or wrapped in a `502 Bad Gateway` if the upstream service is unreachable.

---

## Client Error Handling Recommendations

- Always check the `statusCode` field, not just the HTTP status, as they are always identical.
- Use the `code` field for programmatic error handling (e.g., showing specific UI messages).
- Store the `requestId` when logging client-side errors — it enables the support team to trace the request in server logs.
- On `401 UNAUTHORIZED`, redirect the user to the login page and clear the stored access token.
- On `429 RATE_LIMITED`, honour the `Retry-After` header before retrying.
- On `503 SERVICE_UNAVAILABLE`, implement exponential backoff retry with jitter.