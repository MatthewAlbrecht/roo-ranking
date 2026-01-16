"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface QuestionnaireData {
  favoriteYear?: string;
  memorableSet?: string;
  worstSet?: string;
  favoriteVendor?: string;
  campEssential?: string;
}

interface StepQuestionnaireProps {
  data: QuestionnaireData;
  onChange: (data: QuestionnaireData) => void;
  onFinish: () => void;
  onSkip: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function StepQuestionnaire({
  data,
  onChange,
  onFinish,
  onSkip,
  onBack,
  isSubmitting,
}: StepQuestionnaireProps) {
  const updateField = (field: keyof QuestionnaireData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const hasAnyData = Object.values(data).some((v) => v && v.trim());

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <p className="text-sm text-muted-foreground">
          Tell us about your Bonnaroo experiences
        </p>
        <p className="text-xs text-muted-foreground">
          All fields are optional
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="favoriteYear" className="text-sm">
            Favorite Bonnaroo year?
          </Label>
          <Input
            id="favoriteYear"
            value={data.favoriteYear || ""}
            onChange={(e) => updateField("favoriteYear", e.target.value)}
            placeholder="e.g., 2015"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="memorableSet" className="text-sm">
            Most memorable set?
          </Label>
          <Input
            id="memorableSet"
            value={data.memorableSet || ""}
            onChange={(e) => updateField("memorableSet", e.target.value)}
            placeholder="e.g., Radiohead 2012"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="worstSet" className="text-sm">
            Worst set you&apos;ve seen?
          </Label>
          <Input
            id="worstSet"
            value={data.worstSet || ""}
            onChange={(e) => updateField("worstSet", e.target.value)}
            placeholder="We won't judge..."
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="favoriteVendor" className="text-sm">
            Favorite food vendor?
          </Label>
          <Input
            id="favoriteVendor"
            value={data.favoriteVendor || ""}
            onChange={(e) => updateField("favoriteVendor", e.target.value)}
            placeholder="e.g., Spicy Pie"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="campEssential" className="text-sm">
            Must-have camp essential?
          </Label>
          <Input
            id="campEssential"
            value={data.campEssential || ""}
            onChange={(e) => updateField("campEssential", e.target.value)}
            placeholder="e.g., Portable fan"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onBack} className="flex-1" disabled={isSubmitting}>
          Back
        </Button>
        <Button variant="ghost" onClick={onSkip} disabled={isSubmitting}>
          Skip
        </Button>
        <Button onClick={onFinish} className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Finish"}
        </Button>
      </div>
    </div>
  );
}
