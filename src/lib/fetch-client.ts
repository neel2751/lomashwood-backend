/**
 * Simple fetch client for API calls with cookie authentication
 * Bypasses axios complexity and works reliably with Next.js middleware
 */

type FetchWithAuthOptions = RequestInit & {
  timeoutMs?: number;
  retries?: number;
};

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRIES = 2;

function shouldRetry(status: number): boolean {
  return status === 429 || status >= 500;
}

function buildAbortSignal(timeoutMs: number, externalSignal?: AbortSignal) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  return { signal: controller.signal, cleanup: () => clearTimeout(timeoutId) };
}

export async function fetchWithAuth(url: string, options?: RequestInit) {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
    ...requestOptions
  } = (options ?? {}) as FetchWithAuthOptions;

  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    const externalSignal = requestOptions.signal ?? undefined;
    const { signal, cleanup } = buildAbortSignal(timeoutMs, externalSignal);

    try {
      const response = await fetch(url, {
        ...requestOptions,
        cache: "no-store",
        credentials: "include", // Include cookies (lw_access_token)
        signal,
        headers: {
          "Content-Type": "application/json",
          ...requestOptions.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = errorText || response.statusText || "Request failed";

        if (attempt < retries && shouldRetry(response.status)) {
          attempt += 1;
          continue;
        }

        throw new Error(`API request failed (${response.status}): ${errorMessage}`);
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        return null;
      }

      return response.json();
    } catch (error) {
      lastError = error;

      if (attempt >= retries) {
        break;
      }

      // Retry on transient network errors and request timeouts.
      if (error instanceof TypeError || (error instanceof Error && error.name === "AbortError")) {
        attempt += 1;
        continue;
      }

      throw error;
    } finally {
      cleanup();
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Network request failed");
}

export function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return "";

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null) {
          searchParams.append(key, String(item));
        }
      });
      return;
    }

    searchParams.append(key, String(value));
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}
