"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useAuth } from "@/components/AuthProvider";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RankingDrawer } from "@/components/RankingDrawer";
import { BaliView } from "@/components/BaliView";
import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type Artist = {
  _id: Id<"artists">;
  name: string;
  year: number;
};

export default function ArtistsPage() {
  const { user } = useAuth();
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "bali">("all");

  const activeYear = useQuery(api.settings.getActiveYear);
  const artists = useQuery(
    api.artists.getArtistsByYear,
    activeYear !== undefined ? { year: activeYear } : "skip"
  );
  const rankings = useQuery(
    api.rankings.getUserRankingsForYear,
    user && activeYear !== undefined
      ? { userId: user._id, year: activeYear }
      : "skip"
  );
  const otherRankings = useQuery(
    api.rankings.getOtherRankingsForYear,
    user && activeYear !== undefined
      ? { userId: user._id, year: activeYear }
      : "skip"
  );
  const allUsers = useQuery(api.users.getAllUsers);

  const sortedArtists = artists?.slice().sort((a, b) => a.name.localeCompare(b.name));
  const userMap = new Map(allUsers?.map((u) => [u._id.toString(), u]) ?? []);
  const isLoading = activeYear === undefined || artists === undefined || rankings === undefined;
  const ratedCount = rankings ? Object.keys(rankings).length : 0;

  const getScoreColor = (score: number) => {
    if (score >= 8) return "bg-green-500 text-white";
    if (score >= 5) return "bg-yellow-500 text-white";
    return "bg-red-500 text-white";
  };

  const handleArtistClick = (artist: Artist) => {
    setSelectedArtist(artist);
    setDrawerOpen(true);
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="flex flex-col h-[calc(100vh-8rem)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold">Artists</h1>
              {!isLoading && (
                <p className="text-sm text-muted-foreground">
                  {activeYear} - {ratedCount}/{artists?.length ?? 0} rated
                </p>
              )}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => v && setActiveTab(v as "all" | "bali")} className="flex-1 flex flex-col">
            <TabsList>
              <TabsTrigger value="all">All Artists</TabsTrigger>
              <TabsTrigger value="bali">BALI</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="flex-1 mt-4">
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : sortedArtists?.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No artists for {activeYear}</p>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-14rem)] -mx-4">
                  <div className="px-4">
                    {sortedArtists?.map((artist) => {
                      const score = rankings?.[artist._id] ?? null;
                      const others = otherRankings?.[artist._id] ?? [];
                      return (
                        <button
                          key={artist._id}
                          onClick={() => handleArtistClick(artist)}
                          className={cn(
                            "w-full flex items-center justify-between py-3 px-3 -mx-3",
                            "hover:bg-muted/50 rounded-lg transition-colors text-left"
                          )}
                        >
                          <span className="font-medium">{artist.name}</span>
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
                              <Badge className={cn("min-w-[2rem] justify-center", getScoreColor(score))}>
                                {score}
                              </Badge>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="bali" className="flex-1 mt-4">
              {activeYear !== undefined && rankings !== undefined && (
                <BaliView
                  year={activeYear}
                  rankings={rankings}
                  otherRankings={otherRankings ?? {}}
                  userMap={userMap}
                  onArtistClick={handleArtistClick}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>

        {user && (
          <RankingDrawer
            artist={selectedArtist}
            currentScore={selectedArtist && rankings ? rankings[selectedArtist._id] ?? null : null}
            userId={user._id}
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
          />
        )}
      </Layout>
    </ProtectedRoute>
  );
}
