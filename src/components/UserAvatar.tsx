"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  username: string;
  avatarColor: string;
  score?: number;
  size?: "sm" | "default";
};

export function UserAvatar({ username, avatarColor, score, size = "sm" }: UserAvatarProps) {
  const initial = username[0].toUpperCase();

  return (
    <Tooltip>
      <TooltipTrigger>
        <Avatar size={size}>
          <AvatarFallback className={cn(avatarColor, "text-white font-medium")}>
            {initial}
          </AvatarFallback>
        </Avatar>
      </TooltipTrigger>
      <TooltipContent>
        {username}{score !== undefined ? `: ${score}/10` : ""}
      </TooltipContent>
    </Tooltip>
  );
}
