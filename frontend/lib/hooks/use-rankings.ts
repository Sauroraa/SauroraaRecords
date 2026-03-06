"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchRankings, fetchTrendingReleases } from "@/lib/api";
import { useMemo } from "react";

export function useRankings(month?: string) {
  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const selectedMonth = month || currentMonth;

  const rankingsQuery = useQuery({
    queryKey: ["rankings", selectedMonth],
    queryFn: () => fetchRankings(selectedMonth),
    refetchInterval: selectedMonth === currentMonth ? 15000 : false, // 15 seconds for current month
    staleTime: selectedMonth === currentMonth ? 10000 : 5 * 60 * 1000, // 10s for current, 5min for past
  });

  const trendingQuery = useQuery({
    queryKey: ["trending-releases"],
    queryFn: fetchTrendingReleases,
    refetchInterval: 30000, // 30 seconds
    staleTime: 20000, // 20 seconds
  });

  // Get the most recent update time from both queries
  const lastUpdated = useMemo(() => {
    const rankingsTime = rankingsQuery.dataUpdatedAt;
    const trendingTime = trendingQuery.dataUpdatedAt;
    const mostRecent = Math.max(rankingsTime, trendingTime);
    return mostRecent > 0 ? new Date(mostRecent) : null;
  }, [rankingsQuery.dataUpdatedAt, trendingQuery.dataUpdatedAt]);

  return {
    rankings: rankingsQuery.data || [],
    trending: trendingQuery.data || [],
    isLoading: rankingsQuery.isLoading || trendingQuery.isLoading,
    error: rankingsQuery.error || trendingQuery.error,
    lastUpdated,
    refetch: () => {
      rankingsQuery.refetch();
      trendingQuery.refetch();
    }
  };
}