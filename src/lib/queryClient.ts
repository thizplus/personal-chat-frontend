// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

/**
 * React Query Client Configuration
 *
 * Features:
 * - Cache data for 5 minutes (staleTime)
 * - Keep unused data for 10 minutes (gcTime)
 * - Retry failed requests 1 time
 * - Refetch on window focus
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Cached data garbage collected after 10 minutes of being unused
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

      // Retry failed requests once
      retry: 1,

      // Refetch on window focus (useful for chat apps)
      refetchOnWindowFocus: true,

      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
  },
});
