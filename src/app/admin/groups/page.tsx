"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
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

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR + 1, CURRENT_YEAR, CURRENT_YEAR - 1];

type Group = {
  _id: Id<"groups">;
  name: string;
  year: number;
  artistIds: Id<"artists">[];
  status: "current" | "next" | null;
  order: number;
};

export default function AdminGroupsPage() {
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [groupName, setGroupName] = useState("");
  const [selectedArtistIds, setSelectedArtistIds] = useState<Id<"artists">[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<"current" | "next" | "none">("none");
  const [isCreating, setIsCreating] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  const groups = useQuery(api.groups.getGroupsByYear, { year: selectedYear });
  const artists = useQuery(api.artists.getArtistsByYear, { year: selectedYear });
  const createGroup = useMutation(api.groups.createGroup);
  const updateGroup = useMutation(api.groups.updateGroup);
  const deleteGroup = useMutation(api.groups.deleteGroup);

  const sortedArtists = artists?.slice().sort((a, b) => a.name.localeCompare(b.name));
  const artistMap = new Map(artists?.map((a) => [a._id, a]) ?? []);

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedArtistIds.length === 0) return;
    setIsCreating(true);

    await createGroup({
      name: groupName.trim(),
      year: selectedYear,
      artistIds: selectedArtistIds,
      status: selectedStatus === "none" ? null : selectedStatus,
    });

    setGroupName("");
    setSelectedArtistIds([]);
    setSelectedStatus("none");
    setIsCreating(false);
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup || !groupName.trim() || selectedArtistIds.length === 0) return;

    await updateGroup({
      groupId: editingGroup._id,
      name: groupName.trim(),
      artistIds: selectedArtistIds,
      status: selectedStatus === "none" ? null : selectedStatus,
    });

    setEditingGroup(null);
    setGroupName("");
    setSelectedArtistIds([]);
    setSelectedStatus("none");
  };

  const handleDeleteGroup = async (groupId: Id<"groups">) => {
    await deleteGroup({ groupId });
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setSelectedArtistIds(group.artistIds);
    setSelectedStatus(group.status ?? "none");
  };

  const handleCancelEdit = () => {
    setEditingGroup(null);
    setGroupName("");
    setSelectedArtistIds([]);
    setSelectedStatus("none");
  };

  const toggleArtistSelection = (artistId: Id<"artists">) => {
    setSelectedArtistIds((prev) =>
      prev.includes(artistId)
        ? prev.filter((id) => id !== artistId)
        : [...prev, artistId]
    );
  };

  const getStatusBadge = (status: "current" | "next" | null) => {
    if (status === "current") return <Badge className="bg-green-500">Current</Badge>;
    if (status === "next") return <Badge className="bg-blue-500">Next</Badge>;
    return null;
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Create/Edit Group Card */}
      <Card>
        <CardHeader>
          <CardTitle>{editingGroup ? "Edit Group" : "Create Group"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Year</Label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(v) => {
                if (v) {
                  setSelectedYear(parseInt(v));
                  setSelectedArtistIds([]);
                  setEditingGroup(null);
                }
              }}
              disabled={!!editingGroup}
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
            <Label>Group Name</Label>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., BALI 1"
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={selectedStatus}
              onValueChange={(v) => v && setSelectedStatus(v as "current" | "next" | "none")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="current">Current</SelectItem>
                <SelectItem value="next">Next</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Artists ({selectedArtistIds.length} selected)</Label>
            <ScrollArea className="h-[200px] border rounded-md p-2">
              {sortedArtists?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No artists for {selectedYear}
                </p>
              ) : (
                sortedArtists?.map((artist) => (
                  <button
                    key={artist._id}
                    type="button"
                    onClick={() => toggleArtistSelection(artist._id)}
                    className={`w-full text-left py-1.5 px-2 rounded text-sm transition-colors ${
                      selectedArtistIds.includes(artist._id)
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    {artist.name}
                  </button>
                ))
              )}
            </ScrollArea>
          </div>

          <div className="flex gap-2">
            {editingGroup ? (
              <>
                <Button
                  onClick={handleUpdateGroup}
                  disabled={!groupName.trim() || selectedArtistIds.length === 0}
                  className="flex-1"
                >
                  Update Group
                </Button>
                <Button variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                onClick={handleCreateGroup}
                disabled={isCreating || !groupName.trim() || selectedArtistIds.length === 0}
                className="w-full"
              >
                {isCreating ? "Creating..." : "Create Group"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Groups List Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            Groups for {selectedYear} ({groups?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {groups?.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No groups for {selectedYear}
              </p>
            ) : (
              <div className="space-y-3">
                {groups?.map((group) => (
                  <div
                    key={group._id}
                    className="border rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{group.name}</span>
                        {getStatusBadge(group.status)}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditGroup(group)}
                        >
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger
                            render={<Button variant="ghost" size="sm" />}
                          >
                            Delete
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Group</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete &quot;{group.name}&quot;?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteGroup(group._id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {group.artistIds.length} artists:{" "}
                      {group.artistIds
                        .slice(0, 3)
                        .map((id) => artistMap.get(id)?.name)
                        .filter(Boolean)
                        .join(", ")}
                      {group.artistIds.length > 3 && ` +${group.artistIds.length - 3} more`}
                    </p>
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
