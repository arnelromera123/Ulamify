import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";
import type { CreateMarketRunBody, ListMarketRunsResponse, MarketRunResponse } from "@workspace/api-zod";
import { customFetch } from "./custom-fetch";

export * from "./generated/api";
export * from "./generated/api.schemas";
export { setBaseUrl, setAuthTokenGetter } from "./custom-fetch";
export type { AuthTokenGetter } from "./custom-fetch";

export const getListMarketRunsQueryKey = () => ["/api/operations/market-runs"] as const;

export const listMarketRuns = async (options?: Parameters<typeof customFetch>[1]): Promise<ListMarketRunsResponse> => {
  return customFetch<ListMarketRunsResponse>("/api/operations/market-runs", options);
};

export const useListMarketRuns = <TData = ListMarketRunsResponse, TError = unknown>(options?: {
  query?: Partial<UseQueryOptions<ListMarketRunsResponse, TError, TData>>;
  request?: Parameters<typeof customFetch>[1];
}) => {
  const queryKey = getListMarketRunsQueryKey();
  const queryFn = () => listMarketRuns(options?.request);
  return useQuery({ queryKey, queryFn, ...options?.query });
};

export const createMarketRun = async (
  data: CreateMarketRunBody,
  options?: Parameters<typeof customFetch>[1]
): Promise<MarketRunResponse> => {
  return customFetch<MarketRunResponse>("/api/operations/market-runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    ...options,
  });
};

export const useCreateMarketRun = <TError = unknown, TContext = unknown>(options?: {
  mutation?: UseMutationOptions<MarketRunResponse, TError, { data: CreateMarketRunBody }, TContext>;
  request?: Parameters<typeof customFetch>[1];
}) => {
  return useMutation({
    mutationFn: ({ data }: { data: CreateMarketRunBody }) => createMarketRun(data, options?.request),
    ...options?.mutation,
  });
};
