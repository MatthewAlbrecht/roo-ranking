"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettingsPage() {
  const activeYear = useQuery(api.settings.getActiveYear);
  const yearsWithArtists = useQuery(api.artists.getYearsWithArtists);
  const setActiveYear = useMutation(api.settings.setActiveYear);

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Initialize selectedYear when activeYear loads
  useEffect(() => {
    if (activeYear && selectedYear === null) {
      setSelectedYear(activeYear);
    }
  }, [activeYear, selectedYear]);

  const handleSave = async () => {
    if (selectedYear === null) return;
    setIsSaving(true);
    await setActiveYear({ year: selectedYear });
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const hasChanges = selectedYear !== activeYear;

  // Include current year even if no artists
  const currentYear = new Date().getFullYear();
  const availableYears = [
    ...new Set([currentYear, currentYear + 1, ...(yearsWithArtists ?? [])]),
  ].sort((a, b) => b - a);

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Active Year</Label>
          <p className="text-sm text-muted-foreground">
            The year shown on the main Artists and Aggregate pages
          </p>
          <Select
            value={selectedYear?.toString() ?? ""}
            onValueChange={(v) => v && setSelectedYear(parseInt(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="w-full"
        >
          {isSaving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
