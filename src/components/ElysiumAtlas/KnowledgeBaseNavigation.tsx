"use client";
import PrimaryButton from "@/components/ui/PrimaryButton";
import BackButton from "@/components/ui/BackButton";
import Spinner from "@/components/ui/Spinner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface KnowledgeBaseNavigationProps {
  onBack: () => void;
  onContinue: () => void;
  hasContent?: boolean;
  isLoading?: boolean;
}

export default function KnowledgeBaseNavigation({
  onBack,
  onContinue,
  hasContent = false,
  isLoading = false,
}: KnowledgeBaseNavigationProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleContinue = () => {
    if (!hasContent) {
      setDialogOpen(true);
    } else {
      onContinue();
    }
  };

  const handleConfirmContinue = () => {
    setDialogOpen(false);
    onContinue();
  };
  return (
    <>
      <div className="flex items-center justify-between">
        <BackButton onClick={onBack}>Back</BackButton>
        <PrimaryButton
          onClick={handleContinue}
          disabled={isLoading}
          className="font-semibold min-w-[120px] min-h-[42px] flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Spinner className="border-white dark:border-deep-onyx" />
          ) : (
            <span>Build Agent</span>
          )}
        </PrimaryButton>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>No Knowledge Base Yet</DialogTitle>
            <DialogDescription>
              Your agent works without a knowledge base, but adding one allows
              it to answer questions using your own content. You can add or
              update this anytime.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <PrimaryButton onClick={handleConfirmContinue}>OK</PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
