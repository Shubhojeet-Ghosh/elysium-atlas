"use client";

import { useCallback, useEffect, useState } from "react";
import CustomInput from "@/components/inputs/CustomInput";
import CustomTextareaPrimary from "@/components/inputs/CustomTextareaPrimary";
import PrimaryButton from "@/components/ui/PrimaryButton";
import InfoIcon from "@/components/ui/InfoIcon";
import CancelButton from "@/components/ui/CancelButton";
import TeamKbQnAList from "./TeamKbQnAList";
import { toast } from "sonner";
import { useActiveTeamRole } from "@/hooks/useActiveTeamRole";
import { canManageTeamMembers } from "@/utils/teamPermissions";
import { createQnAPair, updateQnAPair } from "@/utils/kbItemsApi";
import { useKbPendingRegistration } from "./KbPendingChangesContext";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface PendingNewQnA {
  qna_alias: string;
  question: string;
  answer: string;
}

export interface PendingQnAUpdate {
  kb_id: string;
  qna_alias: string;
  question: string;
  answer: string;
}

export default function TeamKbQnA() {
  const teamRole = useActiveTeamRole();
  const readOnly = !canManageTeamMembers(teamRole);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [alias, setAlias] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [pendingNew, setPendingNew] = useState<PendingNewQnA[]>([]);
  const [pendingUpdates, setPendingUpdates] = useState<PendingQnAUpdate[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const resetForm = () => {
    setAlias("");
    setQuestion("");
    setAnswer("");
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setDialogOpen(open);
  };

  const handleAdd = () => {
    if (!alias.trim() || !question.trim() || !answer.trim()) {
      return;
    }

    const trimmedAlias = alias.trim();
    const duplicateExists = pendingNew.some(
      (item) => item.qna_alias.toLowerCase() === trimmedAlias.toLowerCase(),
    );

    if (duplicateExists) {
      toast.error(
        "An entry with this alias name already exists. Please use a different alias.",
      );
      return;
    }

    setPendingNew((prev) => [
      {
        qna_alias: trimmedAlias,
        question: question.trim(),
        answer: answer.trim(),
      },
      ...prev,
    ]);
    resetForm();
    setDialogOpen(false);
    toast.success("QnA entry added");
  };

  const handleCancel = () => {
    resetForm();
    setDialogOpen(false);
  };

  const indexPendingQnA = useCallback(async () => {
    for (const item of pendingNew) {
      const response = await createQnAPair(
        item.qna_alias,
        item.question,
        item.answer,
      );
      if (!response.success) {
        throw new Error(response.message || "Failed to create QnA entry");
      }
    }

    for (const item of pendingUpdates) {
      const response = await updateQnAPair(
        item.kb_id,
        item.qna_alias,
        item.question,
        item.answer,
      );
      if (!response.success) {
        throw new Error(response.message || "Failed to update QnA entry");
      }
    }

    setPendingNew([]);
    setPendingUpdates([]);
    setRefreshKey((k) => k + 1);
    toast.success("QnA entries indexed");
  }, [pendingNew, pendingUpdates]);

  const clearPendingQnA = useCallback(() => {
    setPendingNew([]);
    setPendingUpdates([]);
  }, []);

  const notifyPendingChange = useKbPendingRegistration(
    "qna",
    {
      hasPending: () => pendingNew.length > 0 || pendingUpdates.length > 0,
      getPendingCount: () => pendingNew.length + pendingUpdates.length,
      onIndex: indexPendingQnA,
      onClear: clearPendingQnA,
    },
    [pendingNew, pendingUpdates, indexPendingQnA, clearPendingQnA],
  );

  useEffect(() => {
    notifyPendingChange();
  }, [pendingNew, pendingUpdates, notifyPendingChange]);

  return (
    <>
      <div className="flex flex-col">
        <TeamKbQnAList
          refreshKey={refreshKey}
          pendingNew={pendingNew}
          pendingUpdates={pendingUpdates}
          onPendingUpdate={(update) => {
            setPendingUpdates((prev) => {
              const without = prev.filter((item) => item.kb_id !== update.kb_id);
              return [...without, update];
            });
          }}
          onRemovePendingNew={(aliasName) => {
            setPendingNew((prev) =>
              prev.filter((item) => item.qna_alias !== aliasName),
            );
          }}
          onAddMore={readOnly ? undefined : () => setDialogOpen(true)}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Add QnA Entry</DialogTitle>
            <DialogDescription>
              Add a question and answer pair to your team&apos;s knowledge base.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-[16px] py-2">
            <div className="flex flex-col gap-[4px]">
              <div className="lg:text-[14px] text-[12px] font-bold mt-[4px] flex items-center gap-1.5">
                <span>
                  QnA alias <span className="text-danger-red">*</span>
                </span>
                <InfoIcon
                  className="text-[12px]"
                  text="A QnA alias is a short name or identifier for your question and answer pair. It helps you organize and identify different QnA entries easily."
                />
              </div>
              <CustomInput
                type="text"
                placeholder="Enter QnA alias"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                className="w-full px-[12px] py-[10px]"
              />
            </div>
            <div className="flex flex-col md:flex-row gap-[16px] md:gap-4">
              <div className="flex flex-col gap-[4px] flex-1">
                <div className="lg:text-[14px] text-[12px] font-bold mt-[4px]">
                  Question <span className="text-danger-red">*</span>
                </div>
                <CustomTextareaPrimary
                  placeholder="Enter your question here..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full"
                  rows={4}
                />
              </div>
              <div className="flex flex-col gap-[4px] flex-1">
                <div className="lg:text-[14px] text-[12px] font-bold mt-[4px]">
                  Answer <span className="text-danger-red">*</span>
                </div>
                <CustomTextareaPrimary
                  placeholder="Enter your answer here..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full"
                  rows={4}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <CancelButton
                className="text-[12px] font-semibold flex items-center justify-center gap-2 min-w-[80px] min-h-[36px]"
                onClick={handleCancel}
              >
                Done
              </CancelButton>
            </DialogClose>
            <PrimaryButton
              className="text-[12px] font-semibold flex items-center justify-center gap-2 min-w-[80px] min-h-[36px]"
              onClick={handleAdd}
              disabled={
                !alias.trim() || !question.trim() || !answer.trim()
              }
            >
              Add
            </PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
