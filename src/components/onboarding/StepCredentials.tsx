"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StepCredentialsProps {
  username: string;
  password: string;
  confirmPassword: string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onNext: () => void;
}

export function StepCredentials({
  username,
  password,
  confirmPassword,
  onUsernameChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onNext,
}: StepCredentialsProps) {
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [debouncedUsername, setDebouncedUsername] = useState(username);

  // Debounce username for availability check
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsername(username);
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const usernameCheck = useQuery(
    api.users.checkUsername,
    debouncedUsername.length >= 2 ? { username: debouncedUsername } : "skip"
  );

  const validateAndProceed = () => {
    let hasError = false;

    // Username validation
    if (username.length < 2) {
      setUsernameError("Username must be at least 2 characters");
      hasError = true;
    } else if (usernameCheck && !usernameCheck.available) {
      setUsernameError("Username is already taken");
      hasError = true;
    } else {
      setUsernameError("");
    }

    // Password validation
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      hasError = true;
    } else if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      hasError = true;
    } else {
      setPasswordError("");
    }

    if (!hasError) {
      onNext();
    }
  };

  const isUsernameAvailable = usernameCheck?.available ?? true;
  const showUsernameStatus = debouncedUsername.length >= 2 && usernameCheck !== undefined;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          placeholder="Choose a username"
          autoComplete="username"
        />
        {showUsernameStatus && (
          <p className={`text-sm ${isUsernameAvailable ? "text-green-600" : "text-destructive"}`}>
            {isUsernameAvailable ? "Username is available" : "Username is taken"}
          </p>
        )}
        {usernameError && <p className="text-sm text-destructive">{usernameError}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="At least 6 characters"
          autoComplete="new-password"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => onConfirmPasswordChange(e.target.value)}
          placeholder="Confirm your password"
          autoComplete="new-password"
        />
        {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
      </div>

      <Button
        onClick={validateAndProceed}
        className="w-full"
        disabled={!username || !password || !confirmPassword}
      >
        Next
      </Button>
    </div>
  );
}
