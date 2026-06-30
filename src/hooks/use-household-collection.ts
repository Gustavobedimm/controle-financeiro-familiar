"use client";

import { useCallback, useEffect, useState } from "react";
import { listByHousehold } from "@/lib/firebase/firestore";
import { useAuth } from "@/features/auth/hooks/use-auth";

export function useHouseholdCollection<T extends { id: string }>(collectionName: string) {
  const { householdId, loading: authLoading } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!householdId) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setData(await listByHousehold<T>(collectionName, householdId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  }, [collectionName, householdId]);

  useEffect(() => {
    if (!authLoading) void reload();
  }, [authLoading, reload]);

  return { data, loading: loading || authLoading, error, reload, householdId };
}
