"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function AggregatePage() {
  const activeYear = useQuery(api.settings.getActiveYear);
  const aggregateData = useQuery(
    api.rankings.getAggregateRankings,
    activeYear !== undefined ? { year: activeYear } : "skip"
  );

  const isLoading = activeYear === undefined || aggregateData === undefined;

  // Split into ranked and unranked, sort appropriately
  const rankedArtists = aggregateData
    ?.filter((a) => a.avgScore !== null)
    .sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0)) ?? [];

  const unrankedArtists = aggregateData
    ?.filter((a) => a.avgScore === null)
    .sort((a, b) => a.name.localeCompare(b.name)) ?? [];

  const getScoreColor = (score: number) => {
    const rounded = Math.round(score);
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
    return colors[rounded] ?? "text-gray-600";
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="flex flex-col h-[calc(100vh-8rem)]">
          <div className="mb-4">
            <h1 className="text-2xl font-semibold">Aggregate Rankings</h1>
            {!isLoading && (
              <p className="text-sm text-muted-foreground">
                {activeYear} - {rankedArtists.length} ranked, {unrankedArtists.length} unranked
              </p>
            )}
          </div>

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
                    key={artist.artistId}
                    className="flex items-center py-3 border-b border-border/50"
                  >
                    <span className="w-10 text-sm font-medium text-muted-foreground">
                      #{index + 1}
                    </span>
                    <span className="flex-1 font-medium">{artist.name}</span>
                    <div className="flex items-center gap-3">
                      <span className={`font-semibold ${getScoreColor(artist.avgScore!)}`}>
                        {artist.avgScore!.toFixed(1)}
                      </span>
                      <span className="text-sm text-muted-foreground w-20 text-right">
                        ({artist.ratingCount} {artist.ratingCount === 1 ? "rating" : "ratings"})
                      </span>
                    </div>
                  </div>
                ))}

                {/* Unranked Artists Section */}
                {unrankedArtists.length > 0 && (
                  <>
                    <div className="flex items-center gap-4 py-6">
                      <Separator className="flex-1" />
                      <span className="text-sm text-muted-foreground">No Rankings Yet</span>
                      <Separator className="flex-1" />
                    </div>
                    {unrankedArtists.map((artist) => (
                      <div
                        key={artist.artistId}
                        className="flex items-center py-3 border-b border-border/50"
                      >
                        <span className="w-10" />
                        <span className="flex-1 text-muted-foreground">{artist.name}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
