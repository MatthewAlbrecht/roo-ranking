"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";
import { Id } from "../../../../convex/_generated/dataModel";

function EditableName({
  avatarId,
  initialName,
  token
}: {
  avatarId: Id<"avatars">;
  initialName: string;
  token: string | null;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateAvatarName = useMutation(api.avatars.updateAvatarName);

  const handleSave = async () => {
    if (!token || !name.trim()) return;

    if (name.trim() !== initialName) {
      const result = await updateAvatarName({ token, avatarId, name: name.trim() });
      if (result.success) {
        toast.success("Name updated");
      } else {
        toast.error(result.error || "Failed to update name");
        setName(initialName);
      }
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setName(initialName);
      setIsEditing(false);
    }
  };

  const handleClick = () => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        autoFocus
        className="text-xs text-center w-full bg-transparent border-b border-primary outline-none"
      />
    );
  }

  return (
    <span
      onClick={handleClick}
      className="text-xs text-center truncate w-full cursor-pointer hover:text-primary transition-colors"
      title="Click to edit"
    >
      {initialName}
    </span>
  );
}

export default function AdminAvatarsPage() {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const avatars = useQuery(api.avatars.getAllAvatars);
  const generateUploadUrl = useMutation(api.avatars.generateUploadUrl);
  const saveAvatar = useMutation(api.avatars.saveAvatar);
  const deleteAvatar = useMutation(api.avatars.deleteAvatar);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Generate preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      // Auto-fill name from filename if empty
      if (!name) {
        setName(file.name.replace(/\.[^/.]+$/, "")); // Remove extension
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !name.trim() || !token) return;

    setIsUploading(true);
    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl({ token });

      // Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      if (!result.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await result.json();

      // Save avatar record
      await saveAvatar({
        token,
        storageId,
        name: name.trim(),
      });

      toast.success("Avatar uploaded successfully");
      setName("");
      setSelectedFile(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (avatarId: Id<"avatars">) => {
    if (!token) return;
    const result = await deleteAvatar({ token, avatarId });
    if (result.success) {
      toast.success("Avatar deleted");
    } else {
      toast.error(result.error || "Failed to delete avatar");
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Avatar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Image</Label>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          {preview && (
            <div className="flex justify-center">
              <img
                src={preview}
                alt="Preview"
                className="w-24 h-24 rounded-xl object-cover border-2 border-border"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Avatar name"
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={isUploading || !selectedFile || !name.trim()}
            className="w-full"
          >
            {isUploading ? "Uploading..." : "Upload Avatar"}
          </Button>
        </CardContent>
      </Card>

      {/* Avatars List */}
      <Card>
        <CardHeader>
          <CardTitle>Avatars ({avatars?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {avatars?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No avatars uploaded yet
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {avatars?.map((avatar) => (
                <div key={avatar._id} className="relative group">
                  <div className="flex flex-col items-center gap-2">
                    {avatar.url ? (
                      <img
                        src={avatar.url}
                        alt={avatar.name}
                        className="w-16 h-16 rounded-xl object-cover border-2 border-border"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                        ?
                      </div>
                    )}
                    <EditableName
                      avatarId={avatar._id}
                      initialName={avatar.name}
                      token={token}
                    />
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <button className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-xl text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          x
                        </button>
                      }
                    />
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Avatar</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete &quot;{avatar.name}&quot;?
                          Users using this avatar will fall back to their color.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(avatar._id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
