"use client";
import PrimaryButton from "@/components/ui/PrimaryButton";
import BackButton from "@/components/ui/BackButton";

interface KnowledgeBaseNavigationProps {
  onBack: () => void;
  onContinue: () => void;
  disabled?: boolean;
}

export default function KnowledgeBaseNavigation({
  onBack,
  onContinue,
  disabled = false,
}: KnowledgeBaseNavigationProps) {
  return (
    <div className="flex items-center justify-between">
      <BackButton onClick={onBack}>Back</BackButton>
      <PrimaryButton
        onClick={onContinue}
        disabled={disabled}
        className="font-[600]"
      >
        Continue
      </PrimaryButton>
    </div>
  );
}
