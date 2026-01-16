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
import { Id } from "../../../../convex/_generated/dataModel";

const AVATAR_COLORS = [
  "bg-amber-500",
  "bg-red-500",
  "bg-green-500",
  "bg-blue-500",
  "bg-violet-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-orange-500",
];

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const [resetPasswordUserId, setResetPasswordUserId] = useState<Id<"users"> | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const users = useQuery(api.users.getAllUsers);
  const createUser = useMutation(api.users.createUser);
  const updateUserColor = useMutation(api.users.updateUserColor);
  const deleteUser = useMutation(api.users.deleteUser);
  const resetPassword = useMutation(api.users.resetPassword);

  const handleCreateUser = async () => {
    if (!username.trim() || !password.trim()) return;
    setIsCreating(true);
    setError("");

    const result = await createUser({
      username: username.trim(),
      password: password.trim(),
      avatarColor: selectedColor,
    });

    if (result.success) {
      setUsername("");
      setPassword("");
      setSelectedColor(AVATAR_COLORS[0]);
    } else {
      setError(result.error || "Failed to create user");
    }

    setIsCreating(false);
  };

  const handleDeleteUser = async (userId: Id<"users">) => {
    await deleteUser({ userId });
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUserId || !newPassword.trim()) return;
    setIsResetting(true);
    await resetPassword({ userId: resetPasswordUserId, newPassword: newPassword.trim() });
    setResetPasswordUserId(null);
    setNewPassword("");
    setIsResetting(false);
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
            <Label>Avatar Color</Label>
            <div className="flex gap-2 flex-wrap">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full transition-all ${color} ${
                    selectedColor === color
                      ? "ring-2 ring-offset-2 ring-foreground"
                      : ""
                  }`}
                />
              ))}
            </div>
            {/* Preview */}
            <div className="flex items-center gap-2 mt-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${selectedColor}`}
              >
                {username.charAt(0).toUpperCase() || "?"}
              </div>
              <span className="text-sm text-muted-foreground">Preview</span>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            onClick={handleCreateUser}
            disabled={isCreating || !username.trim() || !password.trim()}
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
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-foreground transition-all ${user.avatarColor}`}
                        >
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3">
                        <div className="flex gap-2 flex-wrap max-w-[200px]">
                          {AVATAR_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => updateUserColor({ userId: user._id, avatarColor: color })}
                              className={`w-8 h-8 rounded-full transition-all ${color} ${
                                user.avatarColor === color
                                  ? "ring-2 ring-offset-2 ring-foreground"
                                  : ""
                              }`}
                            />
                          ))}
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
