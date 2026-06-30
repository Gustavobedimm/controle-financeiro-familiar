"use client";

import { useCallback, useEffect, useState } from "react";
import { listPersonalByHousehold } from "@/lib/firebase/firestore";
import { useAuth } from "@/features/auth/hooks/use-auth";

export function usePersonalCollection<T extends { id: string }>(collectionName: string) {
  const { appUser, householdId, loading: authLoading } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!householdId || !appUser) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setData(await listPersonalByHousehold<T>(collectionName, householdId, appUser.uid));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar seus dados.");
    } finally {
      setLoading(false);
    }
  }, [appUser, collectionName, householdId]);

  useEffect(() => {
    if (!authLoading) void reload();
  }, [authLoading, reload]);

  return { data, loading: loading || authLoading, error, reload, householdId, ownerUid: appUser?.uid ?? null };
}
