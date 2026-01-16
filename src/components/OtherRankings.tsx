"use client";

import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

type OtherRanking = {
  userId: string;
  username: string;
  avatarColor: string;
  score: number;
};

type OtherRankingsProps = {
  rankings: OtherRanking[];
  maxTooltipItems?: number;
};

export function OtherRankings({ rankings, maxTooltipItems = 10 }: OtherRankingsProps) {
  if (rankings.length === 0) return null;

  // Sort by score descending for tooltip display
  const sortedRankings = [...rankings].sort((a, b) => b.score - a.score);
  const displayRankings = sortedRankings.slice(0, maxTooltipItems);
  const remainingCount = sortedRankings.length - maxTooltipItems;

  return (
    <Tooltip>
      <TooltipTrigger render={<span />}>
        <AvatarGroup>
          {rankings.slice(0, 3).map((r) => (
            <Avatar key={r.userId} size="sm">
              <AvatarFallback className={`text-white font-medium text-[10px] ${r.avatarColor}`}>
                {r.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
        </AvatarGroup>
      </TooltipTrigger>
      <TooltipContent side="left" className="p-2">
        <div className="space-y-1">
          {displayRankings.map((r) => (
            <div key={r.userId} className="flex items-center justify-between gap-4 text-xs">
              <span>{r.username}</span>
              <span className="font-medium">{r.score}/10</span>
            </div>
          ))}
          {remainingCount > 0 && (
            <div className="text-xs text-muted-foreground pt-1">
              +{remainingCount} more
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
