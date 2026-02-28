
import {
  QueryClient,
  type QueryKey,
  type UseQueryOptions,
  type UseMutationOptions,
  keepPreviousData,
} from "@tanstack/react-query";
import { toast } from "@/components/ui/toast";
import { ApiError } from "./axios";



export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
 
      staleTime: 60_000,           
      gcTime: 5 * 60_000,          
      retry: (failureCount, error) => {
        
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      placeholderData: keepPreviousData,
    },
    mutations: {
      onError: (error) => {
        const message =
          error instanceof ApiError
            ? error.message
            : "Something went wrong. Please try again.";
        toast({ title: "Error", description: message, variant: "destructive" });
      },
    },
  },
});



export const queryKeys = {
  
  analytics: {
    all: () => ["analytics"] as const,
    overview: (params?: Record<string, unknown>) =>
      ["analytics", "overview", params] as const,
    tracking: {
      all: () => ["analytics", "tracking"] as const,
      list: (params?: Record<string, unknown>) => ["analytics", "tracking", "list", params] as const,
    },
    funnels: {
      all: () => ["analytics", "funnels"] as const,
      list: (params?: Record<string, unknown>) => ["analytics", "funnels", "list", params] as const,
      detail: (id: string) => ["analytics", "funnels", id] as const,
    },
    dashboards: {
      all: () => ["analytics", "dashboards"] as const,
      list: (params?: Record<string, unknown>) => ["analytics", "dashboards", "list", params] as const,
      detail: (id: string) => ["analytics", "dashboards", id] as const,
    },
  },

  
  auth: {
    me: () => ["auth", "me"] as const,
    users: {
      all: () => ["auth", "users"] as const,
      list: (params?: Record<string, unknown>) => ["auth", "users", "list", params] as const,
      detail: (id: string) => ["auth", "users", id] as const,
    },
    roles: {
      all: () => ["auth", "roles"] as const,
      list: (params?: Record<string, unknown>) => ["auth", "roles", "list", params] as const,
      detail: (id: string) => ["auth", "roles", id] as const,
    },
    sessions: {
      all: () => ["auth", "sessions"] as const,
      list: (params?: Record<string, unknown>) => ["auth", "sessions", "list", params] as const,
      detail: (id: string) => ["auth", "sessions", id] as const,
    },
  },

  
  products: {
    all: () => ["products"] as const,
    list: (params?: Record<string, unknown>) => ["products", "list", params] as const,
    detail: (id: string) => ["products", id] as const,
  },
  categories: {
    all: () => ["categories"] as const,
    list: (params?: Record<string, unknown>) => ["categories", "list", params] as const,
    detail: (id: string) => ["categories", id] as const,
  },
  colours: {
    all: () => ["colours"] as const,
    list: (params?: Record<string, unknown>) => ["colours", "list", params] as const,
    detail: (id: string) => ["colours", id] as const,
  },
  sizes: {
    all: () => ["sizes"] as const,
    list: (params?: Record<string, unknown>) => ["sizes", "list", params] as const,
    detail: (id: string) => ["sizes", id] as const,
  },
  inventory: {
    all: () => ["inventory"] as const,
    list: (params?: Record<string, unknown>) => ["inventory", "list", params] as const,
    detail: (id: string) => ["inventory", id] as const,
  },
  pricing: {
    all: () => ["pricing"] as const,
    list: (params?: Record<string, unknown>) => ["pricing", "list", params] as const,
    detail: (id: string) => ["pricing", id] as const,
  },

  
  orders: {
    all: () => ["orders"] as const,
    list: (params?: Record<string, unknown>) => ["orders", "list", params] as const,
    detail: (id: string) => ["orders", id] as const,
  },
  payments: {
    all: () => ["payments"] as const,
    list: (params?: Record<string, unknown>) => ["payments", "list", params] as const,
    detail: (id: string) => ["payments", id] as const,
  },
  invoices: {
    all: () => ["invoices"] as const,
    list: (params?: Record<string, unknown>) => ["invoices", "list", params] as const,
    detail: (id: string) => ["invoices", id] as const,
  },
  refunds: {
    all: () => ["refunds"] as const,
    list: (params?: Record<string, unknown>) => ["refunds", "list", params] as const,
    detail: (id: string) => ["refunds", id] as const,
  },

  
  appointments: {
    all: () => ["appointments"] as const,
    list: (params?: Record<string, unknown>) => ["appointments", "list", params] as const,
    detail: (id: string) => ["appointments", id] as const,
    slots: (params: Record<string, unknown>) => ["appointments", "slots", params] as const,
  },
  availability: {
    all: () => ["availability"] as const,
    list: (params?: Record<string, unknown>) => ["availability", "list", params] as const,
    detail: (id: string) => ["availability", id] as const,
  },
  consultants: {
    all: () => ["consultants"] as const,
    list: (params?: Record<string, unknown>) => ["consultants", "list", params] as const,
    detail: (id: string) => ["consultants", id] as const,
  },
  reminders: {
    all: () => ["reminders"] as const,
    list: (params?: Record<string, unknown>) => ["reminders", "list", params] as const,
    detail: (id: string) => ["reminders", id] as const,
  },

  
  customers: {
    all: () => ["customers"] as const,
    list: (params?: Record<string, unknown>) => ["customers", "list", params] as const,
    detail: (id: string) => ["customers", id] as const,
  },
  reviews: {
    all: () => ["reviews"] as const,
    list: (params?: Record<string, unknown>) => ["reviews", "list", params] as const,
    detail: (id: string) => ["reviews", id] as const,
  },
  support: {
    all: () => ["support"] as const,
    list: (params?: Record<string, unknown>) => ["support", "list", params] as const,
    detail: (id: string) => ["support", id] as const,
  },
  loyalty: {
    all: () => ["loyalty"] as const,
    list: (params?: Record<string, unknown>) => ["loyalty", "list", params] as const,
    detail: (id: string) => ["loyalty", id] as const,
  },

  
  blogs: {
    all: () => ["blogs"] as const,
    list: (params?: Record<string, unknown>) => ["blogs", "list", params] as const,
    detail: (id: string) => ["blogs", id] as const,
  },
  media: {
    all: () => ["media"] as const,
    list: (params?: Record<string, unknown>) => ["media", "list", params] as const,
    detail: (id: string) => ["media", id] as const,
  },
  cmsPages: {
    all: () => ["cms-pages"] as const,
    list: (params?: Record<string, unknown>) => ["cms-pages", "list", params] as const,
    detail: (id: string) => ["cms-pages", id] as const,
  },
  seo: {
    all: () => ["seo"] as const,
    list: (params?: Record<string, unknown>) => ["seo", "list", params] as const,
    detail: (id: string) => ["seo", id] as const,
  },
  landingPages: {
    all: () => ["landing-pages"] as const,
    list: (params?: Record<string, unknown>) => ["landing-pages", "list", params] as const,
    detail: (id: string) => ["landing-pages", id] as const,
  },

  
  notifications: {
    all: () => ["notifications"] as const,
    list: (params?: Record<string, unknown>) => ["notifications", "list", params] as const,
    detail: (id: string) => ["notifications", id] as const,
  },
  templates: {
    all: () => ["templates"] as const,
    list: (params?: Record<string, unknown>) => ["templates", "list", params] as const,
    detail: (id: string) => ["templates", id] as const,
  },
} as const;


export function buildQueryOptions<TData>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  overrides?: Partial<UseQueryOptions<TData>>,
): UseQueryOptions<TData> {
  return {
    queryKey,
    queryFn,
    ...overrides,
  };
}



type InvalidationTarget = QueryKey | QueryKey[];


export function invalidateOn(
  targets: InvalidationTarget,
): UseMutationOptions["onSuccess"] {
  return async () => {
    const keys = Array.isArray(targets[0]) ? (targets as QueryKey[]) : [targets as QueryKey];
    await Promise.all(keys.map((key) => queryClient.invalidateQueries({ queryKey: key })));
  };
}


export function optimisticUpdate<TData, TVariables>(
  queryKey: QueryKey,
  updater: (old: TData | undefined, variables: TVariables) => TData,
): Pick<UseMutationOptions<unknown, unknown, TVariables, { previous: TData | undefined }>,
  "onMutate" | "onError" | "onSettled"> {
  return {
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TData>(queryKey);
      queryClient.setQueryData<TData>(queryKey, (old) => updater(old, variables));
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  };
}

export default queryClient;