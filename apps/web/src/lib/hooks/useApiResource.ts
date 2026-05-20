"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest, type ApiRole } from "@/lib/api/client";
import { useSessionToken } from "@/lib/auth/session";

export function useApiResource<T>(role: ApiRole, path: string, enabled = true) {
  const token = useSessionToken(role);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!token || !enabled) return;
    setLoading(true);
    setError("");
    try {
      setData(await apiRequest<T>(path, { token }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  }, [enabled, path, token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { token, data, loading, error, refresh, setData, setError };
}
