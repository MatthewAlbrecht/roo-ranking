"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Artist = {
  _id: Id<"artists">;
  name: string;
  year: number;
};

type BaliViewProps = {
  year: number;
  rankings: Record<string, number>;
  onArtistClick: (artist: Artist) => void;
};

export function BaliView({ year, rankings, onArtistClick }: BaliViewProps) {
  const groupsData = useQuery(api.groups.getCurrentAndNextGroups, { year });
  const artists = useQuery(api.artists.getArtistsByYear, { year });

  const isLoading = groupsData === undefined || artists === undefined;
  const artistMap = new Map(artists?.map((a) => [a._id, a]) ?? []);

  const getScoreColor = (score: number) => {
    if (score >= 8) return "bg-green-500 text-white";
    if (score >= 5) return "bg-yellow-500 text-white";
    return "bg-red-500 text-white";
  };

  const renderArtistList = (artistIds: Id<"artists">[]) => {
    const groupArtists = artistIds
      .map((id) => artistMap.get(id))
      .filter((a): a is Artist => a !== undefined)
      .sort((a, b) => a.name.localeCompare(b.name));

    const ratedCount = groupArtists.filter((a) => rankings[a._id] !== undefined).length;

    return (
      <>
        <p className="text-sm text-muted-foreground mb-3">
          {ratedCount}/{groupArtists.length} rated
        </p>
        <div className="space-y-1">
          {groupArtists.map((artist) => {
            const score = rankings[artist._id] ?? null;
            return (
              <button
                key={artist._id}
                onClick={() => onArtistClick(artist)}
                className={cn(
                  "w-full flex items-center justify-between py-2.5 px-3",
                  "hover:bg-muted/50 rounded-lg transition-colors text-left"
                )}
              >
                <span className="font-medium text-sm">{artist.name}</span>
                {score !== null && (
                  <Badge className={cn("min-w-[2rem] justify-center text-xs", getScoreColor(score))}>
                    {score}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const { current, next } = groupsData;

  if (!current && !next) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No BALI groups are currently active</p>
        <p className="text-sm text-muted-foreground mt-1">Check back later or view all artists</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <div className="space-y-4 pr-4">
        {current && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Badge className="bg-green-500">Current</Badge>
                {current.name}
              </CardTitle>
            </CardHeader>
            <CardContent>{renderArtistList(current.artistIds)}</CardContent>
          </Card>
        )}

        {next && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Badge className="bg-blue-500">Up Next</Badge>
                {next.name}
              </CardTitle>
            </CardHeader>
            <CardContent>{renderArtistList(next.artistIds)}</CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}
