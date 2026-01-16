"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";

interface StepAvatarProps {
  username: string;
  selectedAvatarId: Id<"_storage"> | null;
  onAvatarChange: (avatarId: Id<"_storage">) => void;
  onNext: () => void;
  onBack?: () => void;
  showBack?: boolean;
}

export function StepAvatarColor({
  username,
  selectedAvatarId,
  onAvatarChange,
  onNext,
  onBack,
  showBack = true,
}: StepAvatarProps) {
  const availableAvatars = useQuery(api.avatars.getAllAvatars);

  const selectedAvatarUrl = availableAvatars?.find(
    (a) => a.storageId === selectedAvatarId
  )?.url;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Choose your avatar
        </p>
        <div className="flex justify-center mb-6">
          <Avatar className="w-28 h-28">
            {selectedAvatarUrl && (
              <AvatarImage
                src={selectedAvatarUrl}
                alt="Selected avatar"
                className="object-cover"
              />
            )}
            <AvatarFallback className="text-3xl font-semibold text-white bg-muted">
              {username.charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {availableAvatars && availableAvatars.length > 0 ? (
        <div className="flex flex-wrap gap-3 justify-center">
          {availableAvatars.map((avatar) => (
            <button
              key={avatar._id}
              type="button"
              onClick={() => onAvatarChange(avatar.storageId)}
              className={cn(
                "w-16 h-16 rounded-xl overflow-hidden transition-all",
                selectedAvatarId === avatar.storageId
                  ? "ring-2 ring-offset-2 ring-primary"
                  : "hover:ring-2 hover:ring-offset-2 hover:ring-muted-foreground"
              )}
            >
              {avatar.url ? (
                <img
                  src={avatar.url}
                  alt={avatar.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-xs">
                  ?
                </div>
              )}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center">
          No avatars available yet.
        </p>
      )}

      <div className="flex gap-2">
        {showBack && onBack && (
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
        )}
        <Button
          onClick={onNext}
          disabled={!selectedAvatarId}
          className={showBack ? "flex-1" : "w-full"}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
