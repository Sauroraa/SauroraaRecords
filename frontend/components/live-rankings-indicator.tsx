import React from 'react';
import { useRankings } from '@/lib/hooks/use-rankings';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, RefreshCw } from 'lucide-react';

interface LiveRankingsIndicatorProps {
  className?: string;
}

export function LiveRankingsIndicator({ className }: LiveRankingsIndicatorProps) {
  const { rankings, trending, isLoading, error, lastUpdated } = useRankings();

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>Mise à jour en cours...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 text-sm text-destructive ${className}`}>
        <Clock className="h-4 w-4" />
        <span>Erreur de mise à jour</span>
      </div>
    );
  }

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `il y a ${diffInSeconds}s`;
    } else if (diffInSeconds < 3600) {
      return `il y a ${Math.floor(diffInSeconds / 60)}min`;
    } else {
      return `il y a ${Math.floor(diffInSeconds / 3600)}h`;
    }
  };

  const isRecent = lastUpdated && (new Date().getTime() - lastUpdated.getTime()) < 30000; // 30 secondes

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant={isRecent ? "violet" : "gray"} className="flex items-center gap-1">
        <TrendingUp className="h-3 w-3" />
        <span>Classements en direct</span>
      </Badge>
      {lastUpdated && (
        <span className="text-xs text-muted-foreground">
          Mis à jour {formatLastUpdated(lastUpdated)}
        </span>
      )}
    </div>
  );
}