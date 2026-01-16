"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface StepYearsAttendedProps {
  selectedYears: number[];
  onYearsChange: (years: number[]) => void;
  onNext: () => void;
  onBack: () => void;
}

// Bonnaroo started in 2002
const BONNAROO_YEARS = Array.from({ length: 24 }, (_, i) => 2002 + i); // 2002-2025
const CANCELED_YEARS: Record<number, string> = {
  2021: "Hurricane Ida had other plans... 🌀",
  2025: "The flood gods weren't having it... 🌊",
};

export function StepYearsAttended({
  selectedYears,
  onYearsChange,
  onNext,
  onBack,
}: StepYearsAttendedProps) {
  const [shownEasterEggs, setShownEasterEggs] = useState<Set<number>>(new Set());

  const toggleYear = (year: number) => {
    const isSelected = selectedYears.includes(year);

    if (!isSelected) {
      // Adding year
      onYearsChange([...selectedYears, year].sort((a, b) => a - b));

      // Show easter egg for canceled years (only once per session)
      if (CANCELED_YEARS[year] && !shownEasterEggs.has(year)) {
        toast(CANCELED_YEARS[year], {
          duration: 4000,
        });
        setShownEasterEggs((prev) => new Set([...prev, year]));
      }
    } else {
      // Removing year
      onYearsChange(selectedYears.filter((y) => y !== year));
    }
  };

  const isCanceled = (year: number) => year in CANCELED_YEARS;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Which Bonnaroos have you attended?
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Select all that apply (optional)
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {BONNAROO_YEARS.map((year) => {
          const isSelected = selectedYears.includes(year);
          const canceled = isCanceled(year);

          return (
            <button
              key={year}
              type="button"
              onClick={() => toggleYear(year)}
              className={cn(
                "py-2 px-1 text-sm rounded-md border transition-all",
                "hover:border-primary/50",
                isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border",
                canceled && !isSelected && "border-dashed opacity-60"
              )}
            >
              {year}
              {canceled && <span className="block text-[10px]">(canceled)</span>}
            </button>
          );
        })}
      </div>

      {selectedYears.length > 0 && (
        <p className="text-sm text-center text-muted-foreground">
          {selectedYears.length} year{selectedYears.length !== 1 ? "s" : ""} selected
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Next
        </Button>
      </div>
    </div>
  );
}
