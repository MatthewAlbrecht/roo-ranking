"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/components/AuthProvider";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ColorPicker } from "@/components/ui/color-picker";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Bonnaroo years
const BONNAROO_YEARS = Array.from({ length: 24 }, (_, i) => 2002 + i);
const CANCELED_YEARS: Record<number, string> = {
  2021: "Hurricane Ida had other plans... 🌀",
  2025: "The flood gods weren't having it... 🌊",
};

interface QuestionnaireData {
  favoriteYear?: string;
  memorableSet?: string;
  worstSet?: string;
  favoriteVendor?: string;
  campEssential?: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const updateProfile = useMutation(api.users.updateProfile);
  const changePassword = useMutation(api.users.changePassword);

  // Avatar color state
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || "#6366f1");
  const [colorSaving, setColorSaving] = useState(false);

  // Years attended state
  const [yearsAttended, setYearsAttended] = useState<number[]>(user?.yearsAttended || []);
  const [yearsSaving, setYearsSaving] = useState(false);

  // Questionnaire state
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData>(
    user?.questionnaire || {}
  );
  const [questionnaireSaving, setQuestionnaireSaving] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Sync state when user data loads
  useEffect(() => {
    if (user) {
      setAvatarColor(user.avatarColor || "#6366f1");
      setYearsAttended(user.yearsAttended || []);
      setQuestionnaire(user.questionnaire || {});
    }
  }, [user]);

  const handleSaveColor = async () => {
    if (!user) return;
    setColorSaving(true);
    const result = await updateProfile({ userId: user._id, avatarColor });
    if (result.success) {
      toast.success("Avatar color updated");
    } else {
      toast.error(result.error || "Failed to update color");
    }
    setColorSaving(false);
  };

  const handleSaveYears = async () => {
    if (!user) return;
    setYearsSaving(true);
    const result = await updateProfile({
      userId: user._id,
      yearsAttended: yearsAttended.length > 0 ? yearsAttended : undefined,
    });
    if (result.success) {
      toast.success("Years attended updated");
    } else {
      toast.error(result.error || "Failed to update years");
    }
    setYearsSaving(false);
  };

  const handleSaveQuestionnaire = async () => {
    if (!user) return;
    setQuestionnaireSaving(true);
    const hasData = Object.values(questionnaire).some((v) => v?.trim());
    const result = await updateProfile({
      userId: user._id,
      questionnaire: hasData ? questionnaire : undefined,
    });
    if (result.success) {
      toast.success("Profile updated");
    } else {
      toast.error(result.error || "Failed to update profile");
    }
    setQuestionnaireSaving(false);
  };

  const handleChangePassword = async () => {
    if (!user) return;
    setPasswordError("");

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setPasswordSaving(true);
    const result = await changePassword({
      userId: user._id,
      currentPassword,
      newPassword,
    });

    if (result.success) {
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPasswordError(result.error || "Failed to change password");
    }
    setPasswordSaving(false);
  };

  const toggleYear = (year: number) => {
    if (yearsAttended.includes(year)) {
      setYearsAttended(yearsAttended.filter((y) => y !== year));
    } else {
      setYearsAttended([...yearsAttended, year].sort((a, b) => a - b));
      if (CANCELED_YEARS[year]) {
        toast(CANCELED_YEARS[year], { duration: 4000 });
      }
    }
  };

  const isCanceled = (year: number) => year in CANCELED_YEARS;

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your account and profile
            </p>
          </div>

          {/* Account Section */}
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>Your login credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={user?.username || ""} disabled />
                <p className="text-xs text-muted-foreground">
                  Username cannot be changed
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Change Password</Label>
                <Input
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="New password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {passwordError && (
                  <p className="text-sm text-destructive">{passwordError}</p>
                )}
                <Button
                  onClick={handleChangePassword}
                  disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
                >
                  {passwordSaving ? "Changing..." : "Change Password"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Avatar Section */}
          <Card>
            <CardHeader>
              <CardTitle>Avatar</CardTitle>
              <CardDescription>Choose your avatar color</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback
                    className="text-2xl font-semibold text-white"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {user?.username?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <ColorPicker color={avatarColor} onChange={setAvatarColor} />
                </div>
              </div>
              <Button onClick={handleSaveColor} disabled={colorSaving}>
                {colorSaving ? "Saving..." : "Save Color"}
              </Button>
            </CardContent>
          </Card>

          {/* Years Attended Section */}
          <Card>
            <CardHeader>
              <CardTitle>Bonnaroo History</CardTitle>
              <CardDescription>Which Bonnaroos have you attended?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-6 gap-2">
                {BONNAROO_YEARS.map((year) => {
                  const isSelected = yearsAttended.includes(year);
                  const canceled = isCanceled(year);

                  return (
                    <button
                      key={year}
                      type="button"
                      onClick={() => toggleYear(year)}
                      className={cn(
                        "py-2 px-1 text-xs rounded-md border transition-all",
                        "hover:border-primary/50",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border",
                        canceled && !isSelected && "border-dashed opacity-60"
                      )}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
              {yearsAttended.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {yearsAttended.length} year{yearsAttended.length !== 1 ? "s" : ""} selected
                </p>
              )}
              <Button onClick={handleSaveYears} disabled={yearsSaving}>
                {yearsSaving ? "Saving..." : "Save Years"}
              </Button>
            </CardContent>
          </Card>

          {/* Questionnaire Section */}
          <Card>
            <CardHeader>
              <CardTitle>About You</CardTitle>
              <CardDescription>Share your Bonnaroo experiences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="favoriteYear" className="text-sm">
                    Favorite Bonnaroo year?
                  </Label>
                  <Input
                    id="favoriteYear"
                    value={questionnaire.favoriteYear || ""}
                    onChange={(e) =>
                      setQuestionnaire({ ...questionnaire, favoriteYear: e.target.value })
                    }
                    placeholder="e.g., 2015"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="memorableSet" className="text-sm">
                    Most memorable set?
                  </Label>
                  <Input
                    id="memorableSet"
                    value={questionnaire.memorableSet || ""}
                    onChange={(e) =>
                      setQuestionnaire({ ...questionnaire, memorableSet: e.target.value })
                    }
                    placeholder="e.g., Radiohead 2012"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="worstSet" className="text-sm">
                    Worst set you&apos;ve seen?
                  </Label>
                  <Input
                    id="worstSet"
                    value={questionnaire.worstSet || ""}
                    onChange={(e) =>
                      setQuestionnaire({ ...questionnaire, worstSet: e.target.value })
                    }
                    placeholder="We won't judge..."
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="favoriteVendor" className="text-sm">
                    Favorite food vendor?
                  </Label>
                  <Input
                    id="favoriteVendor"
                    value={questionnaire.favoriteVendor || ""}
                    onChange={(e) =>
                      setQuestionnaire({ ...questionnaire, favoriteVendor: e.target.value })
                    }
                    placeholder="e.g., Spicy Pie"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="campEssential" className="text-sm">
                    Must-have camp essential?
                  </Label>
                  <Input
                    id="campEssential"
                    value={questionnaire.campEssential || ""}
                    onChange={(e) =>
                      setQuestionnaire({ ...questionnaire, campEssential: e.target.value })
                    }
                    placeholder="e.g., Portable fan"
                  />
                </div>
              </div>
              <Button onClick={handleSaveQuestionnaire} disabled={questionnaireSaving}>
                {questionnaireSaving ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
