"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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

export default function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const router = useRouter();

  const activeYear = useQuery(api.settings.getActiveYear);
  const userProfile = useQuery(api.users.getUserByUsername, { username });

  const rankings = useQuery(
    api.rankings.getUserRankingsForYear,
    userProfile && activeYear !== undefined
      ? { userId: userProfile._id, year: activeYear }
      : "skip"
  );

  const artists = useQuery(
    api.artists.getArtistsByYear,
    activeYear !== undefined ? { year: activeYear } : "skip"
  );

  const isLoading = userProfile === undefined || rankings === undefined || artists === undefined || activeYear === undefined;
  const notFound = userProfile === null;

  // Create ranked and unranked lists like "My Ranking" tab
  const rankedArtists = artists
    ?.filter((a) => rankings?.[a._id] !== undefined)
    .map((a) => ({ ...a, score: rankings![a._id] }))
    .sort((a, b) => b.score - a.score) ?? [];

  const unrankedArtists = artists
    ?.filter((a) => rankings?.[a._id] === undefined)
    .sort((a, b) => a.name.localeCompare(b.name)) ?? [];

  const ratedCount = rankings ? Object.keys(rankings).length : 0;

  // Handle avatar color (hex vs tailwind class)
  const isHexColor = userProfile?.avatarColor?.startsWith("#");

  if (notFound) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)]">
            <h1 className="text-2xl font-semibold mb-2">User not found</h1>
            <p className="text-muted-foreground mb-4">No user with username "{username}"</p>
            <Button onClick={() => router.push("/artists")}>Back to Artists</Button>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="flex flex-col h-[calc(100vh-8rem)]">
          {/* Header */}
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mb-2 -ml-2"
            >
              ← Back
            </Button>

            {isLoading ? (
              <div className="flex items-center gap-4">
                <Skeleton className="w-24 h-24 rounded-xl" />
                <div>
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Avatar className="w-24 h-24">
                  {userProfile?.avatarImageUrl && (
                    <AvatarImage
                      src={userProfile.avatarImageUrl}
                      alt={userProfile.username}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback
                    className={cn(
                      "text-3xl font-semibold text-white",
                      !isHexColor && userProfile?.avatarColor
                    )}
                    style={isHexColor ? { backgroundColor: userProfile?.avatarColor } : undefined}
                  >
                    {userProfile?.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-semibold">{userProfile?.username}</h1>
                  <p className="text-sm text-muted-foreground">
                    {activeYear} - {ratedCount}/{artists?.length ?? 0} rated
                  </p>
                </div>
              </div>
            )}

            {/* Profile Info */}
            {!isLoading && (userProfile?.yearsAttended?.length || userProfile?.questionnaire) && (
              <div className="mt-4 space-y-2 text-sm">
                {userProfile?.yearsAttended && userProfile.yearsAttended.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Bonnaroos: </span>
                    <span>{userProfile.yearsAttended.sort((a, b) => a - b).join(", ")}</span>
                  </div>
                )}
                {userProfile?.questionnaire?.favoriteYear && (
                  <div>
                    <span className="text-muted-foreground">Favorite Year: </span>
                    <span>{userProfile.questionnaire.favoriteYear}</span>
                  </div>
                )}
                {userProfile?.questionnaire?.memorableSet && (
                  <div>
                    <span className="text-muted-foreground">Most Memorable Set: </span>
                    <span>{userProfile.questionnaire.memorableSet}</span>
                  </div>
                )}
                {userProfile?.questionnaire?.worstSet && (
                  <div>
                    <span className="text-muted-foreground">Worst Set: </span>
                    <span>{userProfile.questionnaire.worstSet}</span>
                  </div>
                )}
                {userProfile?.questionnaire?.favoriteVendor && (
                  <div>
                    <span className="text-muted-foreground">Favorite Vendor: </span>
                    <span>{userProfile.questionnaire.favoriteVendor}</span>
                  </div>
                )}
                {userProfile?.questionnaire?.campEssential && (
                  <div>
                    <span className="text-muted-foreground">Camp Essential: </span>
                    <span>{userProfile.questionnaire.campEssential}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rankings List */}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <ScrollArea className="flex-1 -mx-4">
              <div className="px-4">
                {/* Ranked Artists */}
                {rankedArtists.map((artist, index) => (
                  <div
                    key={artist._id}
                    className="flex items-center py-3 border-b border-border/50"
                  >
                    <span className="w-10 text-sm font-medium text-muted-foreground">
                      #{index + 1}
                    </span>
                    <span className="flex-1 font-medium">{artist.name}</span>
                    <span className={`font-semibold ${getScoreTextColor(artist.score)}`}>
                      {artist.score}
                    </span>
                  </div>
                ))}

                {/* Unranked Artists Section */}
                {unrankedArtists.length > 0 && (
                  <>
                    <div className="flex items-center gap-4 py-6">
                      <Separator className="flex-1" />
                      <span className="text-sm text-muted-foreground">Not Ranked</span>
                      <Separator className="flex-1" />
                    </div>
                    {unrankedArtists.map((artist) => (
                      <div
                        key={artist._id}
                        className="flex items-center py-3 border-b border-border/50"
                      >
                        <span className="w-10" />
                        <span className="flex-1 text-muted-foreground">{artist.name}</span>
                      </div>
                    ))}
                  </>
                )}

                {rankedArtists.length === 0 && unrankedArtists.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    No artists for {activeYear}
                  </p>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
