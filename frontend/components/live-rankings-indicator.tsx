import React from 'react';
import { useRankings } from '@/lib/hooks/use-rankings';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

interface LiveRankingsIndicatorProps {
  className?: string;
}

export function LiveRankingsIndicator({ className }: LiveRankingsIndicatorProps) {
  const { t } = useLanguage();
  const { rankings, trending, isLoading, error, lastUpdated } = useRankings();

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>{t.live_rankings.updating}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 text-sm text-destructive ${className}`}>
        <Clock className="h-4 w-4" />
        <span>{t.live_rankings.error}</span>
      </div>
    );
  }

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return diffInSeconds === 0
        ? t.live_rankings.just_now
        : t.live_rankings.seconds_ago.replace("{count}", String(diffInSeconds));
    } else if (diffInSeconds < 3600) {
      return t.live_rankings.minutes_ago.replace("{count}", String(Math.floor(diffInSeconds / 60)));
    } else {
      return t.live_rankings.hours_ago.replace("{count}", String(Math.floor(diffInSeconds / 3600)));
    }
  };

  const isRecent = lastUpdated && (new Date().getTime() - lastUpdated.getTime()) < 30000; // 30 secondes

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant={isRecent ? "violet" : "gray"} className="flex items-center gap-1">
        <TrendingUp className="h-3 w-3" />
        <span>{t.live_rankings.live}</span>
      </Badge>
      {lastUpdated && (
        <span className="text-xs text-muted-foreground">
          {t.live_rankings.updated} {formatLastUpdated(lastUpdated)}
        </span>
      )}
    </div>
  );
}
