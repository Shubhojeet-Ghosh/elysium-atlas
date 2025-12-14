"use client";
import PrimaryButton from "@/components/ui/PrimaryButton";
import BackButton from "@/components/ui/BackButton";
import Spinner from "@/components/ui/Spinner";

interface KnowledgeBaseNavigationProps {
  onBack: () => void;
  onContinue: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export default function KnowledgeBaseNavigation({
  onBack,
  onContinue,
  disabled = false,
  isLoading = false,
}: KnowledgeBaseNavigationProps) {
  return (
    <div className="flex items-center justify-between">
      <BackButton onClick={onBack}>Back</BackButton>
      <PrimaryButton
        onClick={onContinue}
        disabled={disabled || isLoading}
        className="font-semibold min-w-[120px] min-h-[42px] flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <Spinner className="border-white dark:border-deep-onyx" />
        ) : (
          <span>Build Agent</span>
        )}
      </PrimaryButton>
    </div>
  );
}
