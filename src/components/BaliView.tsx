"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/UserAvatar";
import { cn } from "@/lib/utils";

type Artist = {
  _id: Id<"artists">;
  _creationTime: number;
  name: string;
  year: number;
};

type User = {
  username: string;
  avatarColor: string;
};

type BaliViewProps = {
  year: number;
  rankings: Record<string, number>;
  otherRankings: Record<string, Array<{ userId: string; score: number }>>;
  userMap: Map<string, User>;
  onArtistClick: (artist: { _id: Id<"artists">; name: string; year: number }) => void;
};

export function BaliView({ year, rankings, otherRankings, userMap, onArtistClick }: BaliViewProps) {
  const groups = useQuery(api.groups.getGroupsByYear, { year });
  const artists = useQuery(api.artists.getArtistsByYear, { year });

  const isLoading = groups === undefined || artists === undefined;
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
            const others = otherRankings[artist._id] ?? [];
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
                <div className="flex items-center gap-2">
                  {score !== null && others.length > 0 && (
                    <AvatarGroup>
                      {others.slice(0, 3).map((r) => {
                        const otherUser = userMap.get(r.userId);
                        if (!otherUser) return null;
                        return (
                          <UserAvatar
                            key={r.userId}
                            username={otherUser.username}
                            avatarColor={otherUser.avatarColor}
                            score={r.score}
                          />
                        );
                      })}
                      {others.length > 3 && (
                        <AvatarGroupCount>+{others.length - 3}</AvatarGroupCount>
                      )}
                    </AvatarGroup>
                  )}
                  {score !== null && (
                    <Badge className={cn("min-w-[2rem] justify-center text-xs", getScoreColor(score))}>
                      {score}
                    </Badge>
                  )}
                </div>
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

  if (!groups || groups.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No BALI groups have been created</p>
        <p className="text-sm text-muted-foreground mt-1">Check back later or view all artists</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-16rem)] -mx-4">
      <div className="space-y-4 p-4">
        {[...groups].reverse().map((group) => (
          <Card key={group._id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{group.name}</CardTitle>
            </CardHeader>
            <CardContent>{renderArtistList(group.artistIds)}</CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
