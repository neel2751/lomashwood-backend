import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import {
  PaymentClientConfig,
  PaymentIntent,
  PaymentTransaction,
  Refund,
  CreatePaymentIntentPayload,
  CreatePaymentIntentResponse,
  ConfirmPaymentPayload,
  ConfirmPaymentResponse,
  CreateRefundPayload,
  CreateRefundResponse,
  OrderPaymentStatus,
  PaymentTransactionFilter,
  PaginatedTransactions,
  PaymentReconciliationReport,
  WebhookVerificationResult,
  PaymentGateway,
} from "./payment.types";
import {
  PaymentClientError,
  PaymentDeclinedError,
  PaymentIntentCreationError,
  PaymentConfirmationError,
  RefundError,
  RefundExceedsAmountError,
  PaymentNotFoundError,
  PaymentAlreadyProcessedError,
  InvalidWebhookSignatureError,
  PaymentGatewayError,
  PaymentServiceUnavailableError,
  PaymentNetworkError,
  IdempotencyError,
  InsufficientFundsError,
  CardExpiredError,
} from "./payment.errors";

const PAYMENT_ERROR_CODE_MAP: Record<
  string,
  new (message?: string) => PaymentClientError
> = {
  PAYMENT_INTENT_CREATION_FAILED: PaymentIntentCreationError,
  PAYMENT_CONFIRMATION_FAILED: PaymentConfirmationError,
  PAYMENT_DECLINED: PaymentDeclinedError,
  INSUFFICIENT_FUNDS: InsufficientFundsError,
  CARD_EXPIRED: CardExpiredError,
  REFUND_FAILED: RefundError,
  REFUND_EXCEEDS_AMOUNT: RefundExceedsAmountError,
  PAYMENT_NOT_FOUND: PaymentNotFoundError,
  PAYMENT_ALREADY_PROCESSED: PaymentAlreadyProcessedError,
  INVALID_WEBHOOK_SIGNATURE: InvalidWebhookSignatureError,
  PAYMENT_GATEWAY_ERROR: PaymentGatewayError,
  IDEMPOTENCY_CONFLICT: IdempotencyError,
};

export class PaymentClient {
  private readonly http: AxiosInstance;
  private readonly config: Required<Pick<PaymentClientConfig, "baseUrl" | "timeout">> &
    Omit<PaymentClientConfig, "baseUrl" | "timeout">;

  constructor(config: PaymentClientConfig) {
    this.config = {
      timeout: 15000,
      ...config,
    };

    this.http = axios.create({
      baseURL: `${config.baseUrl}/v1`,
      timeout: this.config.timeout,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
  }

  private setupRequestInterceptor(): void {
    this.http.interceptors.request.use(
      (reqConfig: InternalAxiosRequestConfig) => {
        if (this.config.getAccessToken) {
          const token = this.config.getAccessToken();
          if (token) {
            reqConfig.headers.Authorization = `Bearer ${token}`;
          }
        }
        return reqConfig;
      },
      (error: unknown) => Promise.reject(error)
    );
  }

  private setupResponseInterceptor(): void {
    this.http.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: unknown) => {
        if (!axios.isAxiosError(error)) {
          return Promise.reject(new PaymentNetworkError());
        }

        if (!error.response) {
          return Promise.reject(new PaymentNetworkError());
        }

        if (error.response.status === 503) {
          return Promise.reject(new PaymentServiceUnavailableError());
        }

        if (error.response.status === 401 && this.config.onUnauthorized) {
          this.config.onUnauthorized();
        }

        return Promise.reject(this.mapError(error));
      }
    );
  }

  private mapError(error: unknown): PaymentClientError {
    if (!axios.isAxiosError(error) || !error.response) {
      return new PaymentNetworkError();
    }

    const { status, data } = error.response;
    const code: string = data?.code ?? "";
    const message: string = data?.message ?? error?.message ?? "Payment error";

    if (code in PAYMENT_ERROR_CODE_MAP) {
    const ErrorClass = PAYMENT_ERROR_CODE_MAP[code];
    if (ErrorClass) {
    return new ErrorClass(message);
  }
}

    if (status === 502) return new PaymentGatewayError(message);
    if (status === 503) return new PaymentServiceUnavailableError(message);

    return new PaymentClientError(
      message,
      status,
      code || "UNKNOWN_PAYMENT_ERROR",
      data?.details
    );
  }

  async createPaymentIntent(
    payload: CreatePaymentIntentPayload,
    idempotencyKey?: string
  ): Promise<CreatePaymentIntentResponse> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }
    const { data } = await this.http.post<CreatePaymentIntentResponse>(
      "/payments/create-intent",
      payload,
      { headers }
    );
    return data;
  }

  async confirmPayment(
    payload: ConfirmPaymentPayload,
    idempotencyKey?: string
  ): Promise<ConfirmPaymentResponse> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }
    const { data } = await this.http.post<ConfirmPaymentResponse>(
      "/payments/confirm",
      payload,
      { headers }
    );
    return data;
  }

  async getTransaction(transactionId: string): Promise<PaymentTransaction> {
    const { data } = await this.http.get<PaymentTransaction>(
      `/payments/transactions/${transactionId}`
    );
    return data;
  }

  async getTransactionByGatewayId(
    gateway: PaymentGateway,
    gatewayTransactionId: string
  ): Promise<PaymentTransaction> {
    const { data } = await this.http.get<PaymentTransaction>(
      `/payments/transactions/gateway/${gateway}/${gatewayTransactionId}`
    );
    return data;
  }

  async listTransactions(
    filter: PaymentTransactionFilter = {}
  ): Promise<PaginatedTransactions> {
    const { data } = await this.http.get<PaginatedTransactions>(
      "/payments/transactions",
      { params: filter }
    );
    return data;
  }

  async getOrderPaymentStatus(orderId: string): Promise<OrderPaymentStatus> {
    const { data } = await this.http.get<OrderPaymentStatus>(
      `/payments/orders/${orderId}/status`
    );
    return data;
  }

  async createRefund(
    payload: CreateRefundPayload,
    idempotencyKey?: string
  ): Promise<CreateRefundResponse> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }
    const { data } = await this.http.post<CreateRefundResponse>(
      "/payments/refunds",
      payload,
      { headers }
    );
    return data;
  }

  async getRefund(refundId: string): Promise<Refund> {
    const { data } = await this.http.get<Refund>(`/payments/refunds/${refundId}`);
    return data;
  }

  async listRefundsByOrder(orderId: string): Promise<{ refunds: Refund[] }> {
    const { data } = await this.http.get<{ refunds: Refund[] }>(
      `/payments/orders/${orderId}/refunds`
    );
    return data;
  }

  async cancelPaymentIntent(intentId: string): Promise<PaymentIntent> {
    const { data } = await this.http.post<PaymentIntent>(
      `/payments/intents/${intentId}/cancel`
    );
    return data;
  }

  async verifyStripeWebhook(
    signature: string,
    rawBody: string
  ): Promise<WebhookVerificationResult> {
    const { data } = await this.http.post<WebhookVerificationResult>(
      "/webhooks/stripe/verify",
      { signature, rawBody }
    );
    return data;
  }

  async processStripeWebhook(
    signature: string,
    rawBody: string
  ): Promise<{ received: boolean }> {
    const { data } = await this.http.post<{ received: boolean }>(
      "/webhooks/stripe",
      rawBody,
      {
        headers: {
          "Content-Type": "application/json",
          "stripe-signature": signature,
        },
      }
    );
    return data;
  }

  async getReconciliationReport(
    gateway: PaymentGateway,
    fromDate: string,
    toDate: string
  ): Promise<PaymentReconciliationReport> {
    const { data } = await this.http.get<PaymentReconciliationReport>(
      `/payments/reconciliation`,
      { params: { gateway, fromDate, toDate } }
    );
    return data;
  }

  async retryFailedPayment(
    transactionId: string,
    idempotencyKey?: string
  ): Promise<ConfirmPaymentResponse> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }
    const { data } = await this.http.post<ConfirmPaymentResponse>(
      `/payments/transactions/${transactionId}/retry`,
      {},
      { headers }
    );
    return data;
  }

  async deletePaymentMethod(
    userId: string,
    paymentMethodId: string
  ): Promise<{ message: string }> {
    const { data } = await this.http.delete<{ message: string }>(
      `/payments/users/${userId}/methods/${paymentMethodId}`
    );
    return data;
  }

  async setDefaultPaymentMethod(
    userId: string,
    paymentMethodId: string
  ): Promise<{ message: string }> {
    const { data } = await this.http.patch<{ message: string }>(
      `/payments/users/${userId}/methods/${paymentMethodId}/default`
    );
    return data;
  }
  async getPaymentMethods(userId: string): Promise<{ paymentMethods: import("./payment.types").PaymentMethod[] }> {
  const { data } = await this.http.get(`/payments/users/${userId}/methods`);
  return data;
  }
}