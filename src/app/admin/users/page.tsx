"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Id } from "../../../../convex/_generated/dataModel";

export default function AdminUsersPage() {
  const { user: currentUser, token } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedAvatarId, setSelectedAvatarId] = useState<Id<"_storage"> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const [resetPasswordUserId, setResetPasswordUserId] = useState<Id<"users"> | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const users = useQuery(api.users.getAllUsers);
  const availableAvatars = useQuery(api.avatars.getAllAvatars);
  const createUser = useMutation(api.users.createUser);
  const deleteUser = useMutation(api.users.deleteUser);
  const resetPassword = useMutation(api.users.resetPassword);
  const adminSetUserAvatar = useMutation(api.avatars.adminSetUserAvatar);

  const handleCreateUser = async () => {
    if (!username.trim() || !password.trim() || !selectedAvatarId) return;
    setIsCreating(true);
    setError("");

    const result = await createUser({
      username: username.trim(),
      password: password.trim(),
      avatarColor: "#6366f1", // Default fallback color
      avatarImageId: selectedAvatarId,
    });

    if (result.success) {
      setUsername("");
      setPassword("");
      setSelectedAvatarId(null);
    } else {
      setError(result.error || "Failed to create user");
    }

    setIsCreating(false);
  };

  const handleDeleteUser = async (userId: Id<"users">) => {
    if (!token) return;
    await deleteUser({ token, userId });
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUserId || !newPassword.trim() || !token) return;
    setIsResetting(true);
    await resetPassword({ token, userId: resetPasswordUserId, newPassword: newPassword.trim() });
    setResetPasswordUserId(null);
    setNewPassword("");
    setIsResetting(false);
  };

  const handleChangeUserAvatar = async (userId: Id<"users">, storageId: Id<"_storage">) => {
    if (!token) return;
    await adminSetUserAvatar({ token, userId, storageId });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Create User Card */}
      <Card>
        <CardHeader>
          <CardTitle>Create User</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
            />
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>

          <div className="space-y-2">
            <Label>Avatar</Label>
            {availableAvatars && availableAvatars.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {availableAvatars.map((avatar) => (
                  <button
                    key={avatar._id}
                    type="button"
                    onClick={() => setSelectedAvatarId(avatar.storageId)}
                    className={cn(
                      "w-12 h-12 rounded-xl overflow-hidden transition-all",
                      selectedAvatarId === avatar.storageId
                        ? "ring-2 ring-offset-2 ring-foreground"
                        : ""
                    )}
                  >
                    {avatar.url ? (
                      <img
                        src={avatar.url}
                        alt={avatar.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-xs">?</div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No avatars available. Upload some in the Avatars tab.
              </p>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            onClick={handleCreateUser}
            disabled={isCreating || !username.trim() || !password.trim() || !selectedAvatarId}
            className="w-full"
          >
            {isCreating ? "Creating..." : "Create User"}
          </Button>
        </CardContent>
      </Card>

      {/* Users List Card */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({users?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {users?.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-3">
                    <Popover>
                      <PopoverTrigger>
                        {user.avatarImageUrl ? (
                          <div className="w-8 h-8 rounded-xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-foreground transition-all">
                            <img
                              src={user.avatarImageUrl}
                              alt={user.username}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-sm font-medium cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-foreground transition-all">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3">
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Change avatar</p>
                          <div className="flex gap-2 flex-wrap max-w-[200px]">
                            {availableAvatars?.map((avatar) => (
                              <button
                                key={avatar._id}
                                type="button"
                                onClick={() => handleChangeUserAvatar(user._id, avatar.storageId)}
                                className={cn(
                                  "w-10 h-10 rounded-xl overflow-hidden transition-all",
                                  user.avatarImageId === avatar.storageId
                                    ? "ring-2 ring-offset-2 ring-foreground"
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
                                  <div className="w-full h-full bg-muted flex items-center justify-center text-xs">?</div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <div>
                      <span className="font-medium">{user.username}</span>
                      {user.isAdmin && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (admin)
                        </span>
                      )}
                    </div>
                  </div>

                  {user._id !== currentUser?._id && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setResetPasswordUserId(user._id)}
                      >
                        Reset PW
                      </Button>
                      {!user.isAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger
                            render={<Button variant="ghost" size="sm" />}
                          >
                            Delete
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete &quot;{user.username}
                                &quot;? This will also delete all their rankings.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user._id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Reset Password Dialog */}
      <AlertDialog open={resetPasswordUserId !== null} onOpenChange={(open) => !open && setResetPasswordUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new password for{" "}
              {users?.find((u) => u._id === resetPasswordUserId)?.username || "this user"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            type="password"
            placeholder="New password (min 6 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNewPassword("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetPassword}
              disabled={isResetting || newPassword.length < 6}
            >
              {isResetting ? "Resetting..." : "Reset Password"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
