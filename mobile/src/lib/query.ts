import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useAuth } from "./auth";
export function useApi<T>(path: string, enabled = true, poll?: number) {
  const { user } = useAuth();
  return useQuery<T>({
    queryKey: [user?.id, path],
    queryFn: () => api<T>(path),
    enabled: !!user && enabled,
    staleTime: 15000,
    retry: 1,
    refetchInterval: poll ?? false,
  });
}
export function useRefresh() {
  const client = useQueryClient();
  return () => client.invalidateQueries();
}
