"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Id } from "../../../../convex/_generated/dataModel";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR + 1, CURRENT_YEAR, CURRENT_YEAR - 1];

export default function AdminArtistsPage() {
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [artistsText, setArtistsText] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const artists = useQuery(api.artists.getArtistsByYear, {
    year: selectedYear,
  });
  const addArtists = useMutation(api.artists.addArtists);
  const deleteArtist = useMutation(api.artists.deleteArtist);

  const handleAddArtists = async () => {
    if (!artistsText.trim()) return;
    setIsAdding(true);

    const names = artistsText.split("\n").filter((n) => n.trim());
    await addArtists({ names, year: selectedYear });

    setArtistsText("");
    setIsAdding(false);
  };

  const handleDeleteArtist = async (artistId: Id<"artists">) => {
    await deleteArtist({ artistId });
  };

  const sortedArtists = artists
    ?.slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Add Artists Card */}
      <Card>
        <CardHeader>
          <CardTitle>Add Artists</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Year</Label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(v) => v && setSelectedYear(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Artists (one per line)</Label>
            <Textarea
              value={artistsText}
              onChange={(e) => setArtistsText(e.target.value)}
              placeholder="Paste artist names here, one per line..."
              rows={10}
            />
          </div>

          <Button
            onClick={handleAddArtists}
            disabled={isAdding || !artistsText.trim()}
            className="w-full"
          >
            {isAdding ? "Adding..." : "Add Artists"}
          </Button>
        </CardContent>
      </Card>

      {/* Artists List Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            Artists for {selectedYear} ({artists?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {sortedArtists?.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No artists for {selectedYear}
              </p>
            ) : (
              <div className="space-y-2">
                {sortedArtists?.map((artist) => (
                  <div
                    key={artist._id}
                    className="flex items-center justify-between py-2"
                  >
                    <span>{artist.name}</span>
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={<Button variant="ghost" size="sm" />}
                      >
                        Delete
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Artist</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;{artist.name}
                            &quot;? This will also delete all rankings for this
                            artist.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteArtist(artist._id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
