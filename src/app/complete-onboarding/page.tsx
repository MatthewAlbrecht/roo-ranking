"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StepAvatarColor } from "@/components/onboarding/StepAvatarColor";
import { StepYearsAttended } from "@/components/onboarding/StepYearsAttended";
import { StepQuestionnaire, QuestionnaireData } from "@/components/onboarding/StepQuestionnaire";
import { toast } from "sonner";

type Step = "avatar" | "years" | "questionnaire";

const STEPS: Step[] = ["avatar", "years", "questionnaire"];

const STEP_TITLES: Record<Step, string> = {
  avatar: "Choose Your Color",
  years: "Your Bonnaroo History",
  questionnaire: "About You",
};

export default function CompleteOnboardingPage() {
  const router = useRouter();
  const { user, isLoading, token } = useAuth();
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  const [currentStep, setCurrentStep] = useState<Step>("avatar");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [avatarColor, setAvatarColor] = useState("#6366f1");
  const [yearsAttended, setYearsAttended] = useState<number[]>([]);
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireData>({});

  // Initialize with existing user data if available
  useEffect(() => {
    if (user) {
      if (user.avatarColor) setAvatarColor(user.avatarColor);
      if (user.yearsAttended) setYearsAttended(user.yearsAttended);
      if (user.questionnaire) setQuestionnaire(user.questionnaire);
    }
  }, [user]);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  // Redirect if onboarding already complete
  useEffect(() => {
    if (!isLoading && user?.onboardingComplete) {
      router.push("/artists");
    }
  }, [user, isLoading, router]);

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
    if (!user || !token) return;
    setIsSubmitting(true);

    try {
      const result = await completeOnboarding({
        token,
        avatarColor,
        yearsAttended: yearsAttended.length > 0 ? yearsAttended : undefined,
        questionnaire: includeQuestionnaire && Object.values(questionnaire).some(v => v?.trim())
          ? questionnaire
          : undefined,
      });

      if (result.success) {
        toast.success("Welcome to Roo Ranking!");
        router.push("/artists");
      } else {
        toast.error(result.error || "Failed to complete onboarding");
        setIsSubmitting(false);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (isLoading || !user || user.onboardingComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <Skeleton className="h-8 w-48 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{STEP_TITLES[currentStep]}</CardTitle>
          <CardDescription>
            Welcome back, {user.username}! Let&apos;s finish setting up your profile.
          </CardDescription>
          <p className="text-xs text-muted-foreground pt-1">
            Step {currentStepIndex + 1} of {STEPS.length}
          </p>
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
          {currentStep === "avatar" && (
            <StepAvatarColor
              username={user.username}
              color={avatarColor}
              onColorChange={setAvatarColor}
              onNext={goToNext}
              showBack={false}
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
    </div>
  );
}
