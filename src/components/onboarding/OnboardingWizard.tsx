"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StepCredentials } from "./StepCredentials";
import { StepAvatarColor } from "./StepAvatarColor";
import { StepYearsAttended } from "./StepYearsAttended";
import { StepQuestionnaire, QuestionnaireData } from "./StepQuestionnaire";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";

type Step = "credentials" | "avatar" | "years" | "questionnaire";

const STEPS: Step[] = ["credentials", "avatar", "years", "questionnaire"];

const STEP_TITLES: Record<Step, string> = {
  credentials: "Create Account",
  avatar: "Choose Your Avatar",
  years: "Your Bonnaroo History",
  questionnaire: "About You",
};

export function OnboardingWizard() {
  const router = useRouter();
  const { login } = useAuth();
  const register = useMutation(api.users.register);

  const [currentStep, setCurrentStep] = useState<Step>("credentials");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarImageId, setAvatarImageId] = useState<Id<"_storage"> | null>(null);
  const [yearsAttended, setYearsAttended] = useState<number[]>([]);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData>({});

  const currentStepIndex = STEPS.indexOf(currentStep);

  const goToNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  };

  const handleFinish = async (includeQuestionnaire: boolean) => {
    setIsSubmitting(true);

    try {
      // First register the user with profile data
      const result = await register({
        username,
        password,
        avatarColor: "#6366f1", // Default fallback color
        avatarImageId: avatarImageId ?? undefined,
        yearsAttended: yearsAttended.length > 0 ? yearsAttended : undefined,
        questionnaire: includeQuestionnaire && Object.values(questionnaire).some(v => v?.trim())
          ? questionnaire
          : undefined,
      });

      if (result.success) {
        // Log in with the new credentials
        const loginResult = await login(username, password);
        if (loginResult.success) {
          toast.success("Welcome to Roo Ranking!");
          router.push("/artists");
        } else {
          // Registration worked but login failed - redirect to login page
          toast.success("Account created! Please log in.");
          router.push("/");
        }
      } else {
        toast.error(result.error || "Failed to create account");
        setIsSubmitting(false);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{STEP_TITLES[currentStep]}</CardTitle>
        <CardDescription>
          Step {currentStepIndex + 1} of {STEPS.length}
        </CardDescription>
        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-2">
          {STEPS.map((step, index) => (
            <div
              key={step}
              className={`w-2 h-2 rounded-full transition-colors ${
                index <= currentStepIndex ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {currentStep === "credentials" && (
          <StepCredentials
            username={username}
            password={password}
            confirmPassword={confirmPassword}
            onUsernameChange={setUsername}
            onPasswordChange={setPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onNext={goToNext}
          />
        )}
        {currentStep === "avatar" && (
          <StepAvatarColor
            username={username}
            selectedAvatarId={avatarImageId}
            onAvatarChange={setAvatarImageId}
            onNext={goToNext}
            onBack={goBack}
          />
        )}
        {currentStep === "years" && (
          <StepYearsAttended
            selectedYears={yearsAttended}
            onYearsChange={setYearsAttended}
            onNext={goToNext}
            onBack={goBack}
          />
        )}
        {currentStep === "questionnaire" && (
          <StepQuestionnaire
            data={questionnaire}
            onChange={setQuestionnaire}
            onFinish={() => handleFinish(true)}
            onSkip={() => handleFinish(false)}
            onBack={goBack}
            isSubmitting={isSubmitting}
          />
        )}
      </CardContent>
    </Card>
  );
}
