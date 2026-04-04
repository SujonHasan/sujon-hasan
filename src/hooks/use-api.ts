"use client";

import useSWR, { SWRConfiguration } from "swr";
import { useAuth } from "@/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { useCallback } from "react";

function createFetcher(token: string | null) {
  return async (url: string) => {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(url, { headers });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Request failed");
    return data.data;
  };
}

export function useApi<T>(url: string | null, config?: SWRConfiguration) {
  const { token } = useAuth();
  const fetcher = createFetcher(token);
  return useSWR<T>(url, fetcher, {
    revalidateOnFocus: false,
    ...config,
  });
}

export function useApiMutate() {
  const { token } = useAuth();
  const { toast } = useToast();

  const apiRequest = useCallback(
    async (url: string, method: string, body?: unknown) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();

      if (!data.success) {
        toast({
          title: "Error",
          description: data.error || "Something went wrong",
          variant: "destructive",
        });
        throw new Error(data.error);
      }

      return data;
    },
    [token, toast]
  );

  return { apiRequest };
}
