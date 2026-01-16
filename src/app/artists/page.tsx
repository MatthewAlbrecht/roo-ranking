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
import { OtherRankings } from "@/components/OtherRankings";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
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
  const [activeTab, setActiveTab] = useState<"all" | "bali" | "my">("all");
  const [search, setSearch] = useState("");

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

  const userMap = new Map(allUsers?.map((u) => [u._id.toString(), u]) ?? []);

  // Filter artists for "All" tab
  const filteredArtists = artists
    ?.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));
  const isLoading = activeYear === undefined || artists === undefined || rankings === undefined;
  const ratedCount = rankings ? Object.keys(rankings).length : 0;

  const getScoreColor = (score: number) => {
    const colors: Record<number, string> = {
      10: "bg-purple-500 text-white",
      9: "bg-blue-500 text-white",
      8: "bg-cyan-500 text-white",
      7: "bg-teal-500 text-white",
      6: "bg-green-500 text-white",
      5: "bg-lime-500 text-white",
      4: "bg-yellow-500 text-white",
      3: "bg-amber-500 text-white",
      2: "bg-orange-500 text-white",
      1: "bg-red-500 text-white",
    };
    return colors[score] ?? "bg-gray-500 text-white";
  };

  const getScoreTextColor = (score: number) => {
    const colors: Record<number, string> = {
      10: "text-purple-600",
      9: "text-blue-600",
      8: "text-cyan-600",
      7: "text-teal-600",
      6: "text-green-600",
      5: "text-lime-600",
      4: "text-yellow-600",
      3: "text-amber-600",
      2: "text-orange-600",
      1: "text-red-600",
    };
    return colors[score] ?? "text-gray-600";
  };

  // For "My Ranking" tab - split into ranked and unranked
  const myRankedArtists = artists
    ?.filter((a) => rankings?.[a._id] !== undefined)
    .map((a) => ({ ...a, score: rankings![a._id] }))
    .sort((a, b) => b.score - a.score) ?? [];

  const myUnrankedArtists = artists
    ?.filter((a) => rankings?.[a._id] === undefined)
    .sort((a, b) => a.name.localeCompare(b.name)) ?? [];

  const handleArtistClick = (artist: Artist) => {
    setSelectedArtist(artist);
    setDrawerOpen(true);
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="flex flex-col h-[calc(100vh-8rem)]">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold">Artists</h1>
                {!isLoading && (
                  <p className="text-sm text-muted-foreground">
                    {activeYear} - {ratedCount}/{artists?.length ?? 0} rated
                  </p>
                )}
              </div>
            </div>
            <div className="relative mt-3">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search artists..."
                className="pr-8"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => v && setActiveTab(v as "all" | "bali" | "my")} className="flex-1 flex flex-col">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="my">My Ranking</TabsTrigger>
              <TabsTrigger value="bali">BALI</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="flex-1 mt-4">
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : filteredArtists?.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {search ? `No artists match "${search}"` : `No artists for ${activeYear}`}
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-17rem)] -mx-4">
                  <div className="px-4">
                    {filteredArtists?.map((artist) => {
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
                              <OtherRankings
                                rankings={others.map((r) => {
                                  const otherUser = userMap.get(r.userId);
                                  return otherUser
                                    ? { userId: r.userId, username: otherUser.username, avatarColor: otherUser.avatarColor, score: r.score }
                                    : null;
                                }).filter((r): r is NonNullable<typeof r> => r !== null)}
                              />
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

            <TabsContent value="my" className="flex-1 mt-4">
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-17rem)] -mx-4">
                  <div className="px-4">
                    {/* Ranked Artists */}
                    {myRankedArtists.map((artist, index) => (
                      <button
                        key={artist._id}
                        onClick={() => handleArtistClick(artist)}
                        className="w-full flex items-center py-3 border-b border-border/50 hover:bg-muted/50 transition-colors text-left"
                      >
                        <span className="w-10 text-sm font-medium text-muted-foreground">
                          #{index + 1}
                        </span>
                        <span className="flex-1 font-medium">{artist.name}</span>
                        <span className={`font-semibold ${getScoreTextColor(artist.score)}`}>
                          {artist.score}
                        </span>
                      </button>
                    ))}

                    {/* Unranked Artists Section */}
                    {myUnrankedArtists.length > 0 && (
                      <>
                        <div className="flex items-center gap-4 py-6">
                          <Separator className="flex-1" />
                          <span className="text-sm text-muted-foreground">Not Ranked</span>
                          <Separator className="flex-1" />
                        </div>
                        {myUnrankedArtists.map((artist) => (
                          <button
                            key={artist._id}
                            onClick={() => handleArtistClick(artist)}
                            className="w-full flex items-center py-3 border-b border-border/50 hover:bg-muted/50 transition-colors text-left"
                          >
                            <span className="w-10" />
                            <span className="flex-1 text-muted-foreground">{artist.name}</span>
                          </button>
                        ))}
                      </>
                    )}
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
