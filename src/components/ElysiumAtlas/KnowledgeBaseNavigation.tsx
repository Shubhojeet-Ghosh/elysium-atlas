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
    <div className="sticky bottom-0 left-0 right-0  border-t border-gray-200 dark:border-gray-700 py-4 px-4 -mx-4 -mb-4 z-10">
      <div className="flex items-center justify-between">
        <BackButton onClick={onBack}>Back</BackButton>
        <PrimaryButton onClick={onContinue} disabled={disabled}>
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
}
