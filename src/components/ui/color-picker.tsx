"use client";

import { HexColorPicker, HexColorInput } from "react-colorful";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ color, onChange, className }: ColorPickerProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <HexColorPicker color={color} onChange={onChange} style={{ width: "100%" }} />
      <div className="flex items-center gap-2">
        <div
          className="w-10 h-10 rounded-lg border border-border shrink-0"
          style={{ backgroundColor: color }}
        />
        <HexColorInput
          color={color}
          onChange={onChange}
          prefixed
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 uppercase font-mono"
        />
      </div>
    </div>
  );
}
