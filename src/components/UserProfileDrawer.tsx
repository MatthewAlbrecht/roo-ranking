"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Questionnaire {
  favoriteYear?: string;
  memorableSet?: string;
  worstSet?: string;
  favoriteVendor?: string;
  campEssential?: string;
}

interface UserProfile {
  _id: Id<"users">;
  username: string;
  avatarColor: string;
  yearsAttended?: number[];
  questionnaire?: Questionnaire;
}

interface UserProfileDrawerProps {
  user: UserProfile | null;
  year: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

export function UserProfileDrawer({
  user,
  year,
  open,
  onOpenChange,
}: UserProfileDrawerProps) {
  const rankings = useQuery(
    api.rankings.getUserRankingsForYear,
    user ? { userId: user._id, year } : "skip"
  );

  const artists = useQuery(
    api.artists.getArtistsByYear,
    year !== undefined ? { year } : "skip"
  );

  // Create a map of artistId -> artist for lookup
  const artistMap = new Map(artists?.map((a) => [a._id.toString(), a]) ?? []);

  // Get ranked artists sorted by score
  const rankedArtists = rankings
    ? Object.entries(rankings)
        .map(([artistId, score]) => ({
          artistId,
          artist: artistMap.get(artistId),
          score,
        }))
        .filter((r) => r.artist)
        .sort((a, b) => b.score - a.score)
    : [];

  const isLoading = !user || rankings === undefined || artists === undefined;
  const ratedCount = rankings ? Object.keys(rankings).length : 0;

  const questionnaire = user?.questionnaire;
  const hasQuestionnaireData = questionnaire && Object.values(questionnaire).some((v) => v?.trim());

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-center pb-2">
          {user ? (
            <>
              <div className="flex justify-center mb-2">
                <Avatar className="w-16 h-16">
                  <AvatarFallback
                    className={cn(
                      "text-2xl font-semibold text-white",
                      !user.avatarColor?.startsWith("#") && user.avatarColor
                    )}
                    style={user.avatarColor?.startsWith("#") ? { backgroundColor: user.avatarColor } : undefined}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <DrawerTitle>{user.username}</DrawerTitle>
              <DrawerDescription>
                {ratedCount} artists ranked for {year}
              </DrawerDescription>
            </>
          ) : (
            <>
              <Skeleton className="w-16 h-16 rounded-full mx-auto mb-2" />
              <Skeleton className="h-6 w-32 mx-auto" />
            </>
          )}
        </DrawerHeader>

        <ScrollArea className="flex-1 px-4 pb-4">
          {/* Years Attended */}
          {user?.yearsAttended && user.yearsAttended.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                Bonnaroos Attended
              </h3>
              <p className="text-sm">
                {user.yearsAttended.sort((a, b) => a - b).join(", ")}
              </p>
            </div>
          )}

          {/* Questionnaire */}
          {hasQuestionnaireData && (
            <div className="mb-4 space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                About {user?.username}
              </h3>
              {questionnaire?.favoriteYear && (
                <div>
                  <span className="text-xs text-muted-foreground">Favorite Year: </span>
                  <span className="text-sm">{questionnaire.favoriteYear}</span>
                </div>
              )}
              {questionnaire?.memorableSet && (
                <div>
                  <span className="text-xs text-muted-foreground">Most Memorable Set: </span>
                  <span className="text-sm">{questionnaire.memorableSet}</span>
                </div>
              )}
              {questionnaire?.worstSet && (
                <div>
                  <span className="text-xs text-muted-foreground">Worst Set: </span>
                  <span className="text-sm">{questionnaire.worstSet}</span>
                </div>
              )}
              {questionnaire?.favoriteVendor && (
                <div>
                  <span className="text-xs text-muted-foreground">Favorite Vendor: </span>
                  <span className="text-sm">{questionnaire.favoriteVendor}</span>
                </div>
              )}
              {questionnaire?.campEssential && (
                <div>
                  <span className="text-xs text-muted-foreground">Camp Essential: </span>
                  <span className="text-sm">{questionnaire.campEssential}</span>
                </div>
              )}
            </div>
          )}

          {(user?.yearsAttended?.length || hasQuestionnaireData) && rankedArtists.length > 0 && (
            <Separator className="my-4" />
          )}

          {/* Rankings */}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : rankedArtists.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">
              No rankings yet for {year}
            </p>
          ) : (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {year} Rankings
              </h3>
              <div className="space-y-1">
                {rankedArtists.map((item, index) => (
                  <div
                    key={item.artistId}
                    className="flex items-center py-2 border-b border-border/50"
                  >
                    <span className="w-8 text-sm font-medium text-muted-foreground">
                      #{index + 1}
                    </span>
                    <span className="flex-1 text-sm">{item.artist?.name}</span>
                    <Badge className={cn("min-w-[2rem] justify-center", getScoreColor(item.score))}>
                      {item.score}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
