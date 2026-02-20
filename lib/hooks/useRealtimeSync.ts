"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    supabase = createClient(url, key);
  }
  return supabase;
}

export function useRealtimeSync() {
  const router = useRouter();

  useEffect(() => {
    const client = getSupabase();
    if (!client) return;

    const channel = client
      .channel("db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Category" },
        () => router.refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "TodoItem" },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [router]);
}
