"use client";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Artist = {
  _id: Id<"artists">;
  name: string;
  year: number;
};

type RankingDrawerProps = {
  artist: Artist | null;
  currentScore: number | null;
  userId: Id<"users">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RankingDrawer({
  artist,
  currentScore,
  userId,
  open,
  onOpenChange,
}: RankingDrawerProps) {
  const setRanking = useMutation(api.rankings.setRanking);
  const clearRanking = useMutation(api.rankings.clearRanking);

  const handleRate = async (score: number) => {
    if (!artist) return;
    await setRanking({ userId, artistId: artist._id, score });
    toast.success(`Rated ${artist.name}: ${score}/10`);
    onOpenChange(false);
  };

  const handleClear = async () => {
    if (!artist) return;
    await clearRanking({ userId, artistId: artist._id });
    toast.success(`Cleared rating for ${artist.name}`);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-lg">{artist?.name}</DrawerTitle>
          <DrawerDescription>
            {currentScore ? `Current rating: ${currentScore}/10` : "Tap a number to rate"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4">
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
              <button
                key={score}
                onClick={() => handleRate(score)}
                className={cn(
                  "h-14 rounded-lg text-lg font-semibold transition-all",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  currentScore === score
                    ? "bg-primary text-primary-foreground ring-2 ring-primary"
                    : "bg-muted hover:bg-muted/80 text-foreground"
                )}
              >
                {score}
              </button>
            ))}
          </div>
        </div>

        <DrawerFooter>
          {currentScore !== null && (
            <Button variant="outline" onClick={handleClear} className="w-full">
              Clear Rating
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
