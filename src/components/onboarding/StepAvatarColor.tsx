"use client";

import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface StepAvatarColorProps {
  username: string;
  color: string;
  onColorChange: (color: string) => void;
  onNext: () => void;
  onBack?: () => void;
  showBack?: boolean;
}

export function StepAvatarColor({
  username,
  color,
  onColorChange,
  onNext,
  onBack,
  showBack = true,
}: StepAvatarColorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Pick a color for your avatar
        </p>
        <div className="flex justify-center mb-6">
          <Avatar className="w-24 h-24">
            <AvatarFallback
              className="text-3xl font-semibold text-white"
              style={{ backgroundColor: color }}
            >
              {username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <ColorPicker color={color} onChange={onColorChange} />

      <div className="flex gap-2">
        {showBack && onBack && (
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
        )}
        <Button onClick={onNext} className={showBack ? "flex-1" : "w-full"}>
          Next
        </Button>
      </div>
    </div>
  );
}
