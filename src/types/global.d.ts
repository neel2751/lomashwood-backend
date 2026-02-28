export {};

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    gtag: (...args: unknown[]) => void;
  }

  type Nullable<T> = T | null;

  type Optional<T> = T | undefined;

  type Maybe<T> = T | null | undefined;

  type ID = string;

  type ISODateString = string;

  type HexColor = string;

  type Prettify<T> = {
    [K in keyof T]: T[K];
  } & {};

  type DeepPartial<T> = T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

  type ValueOf<T> = T[keyof T];

  type Entries<T> = {
    [K in keyof T]: [K, T[K]];
  }[keyof T][];

  type NonEmptyArray<T> = [T, ...T[]];

  type PickPartial<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

  type RequiredFields<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_API_BASE_URL: string;
      NEXT_PUBLIC_APP_VERSION: string;
      NEXT_PUBLIC_GTM_ID: string;
      NEXT_PUBLIC_GA_MEASUREMENT_ID: string;
      NEXT_PUBLIC_KITCHEN_EMAIL: string;
      NEXT_PUBLIC_BEDROOM_EMAIL: string;
      NEXT_PUBLIC_BUSINESS_EMAIL: string;
      NODE_ENV: "development" | "production" | "test";
    }
  }
}