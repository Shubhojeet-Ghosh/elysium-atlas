"use client";
import { useState } from "react";
import CustomInput from "@/components/inputs/CustomInput";
import CustomTextareaPrimary from "@/components/inputs/CustomTextareaPrimary";
import PrimaryButton from "@/components/ui/PrimaryButton";
import InfoIcon from "@/components/ui/InfoIcon";
import CancelButton from "../ui/CancelButton";
import AgentQnAList from "./AgentQnAList";
import { toast } from "sonner";
import { useAgentReadOnly } from "@/hooks/useCanManageAgents";
import Spinner from "@/components/ui/Spinner";
import {
  findTeamQnAByAlias,
  isOnAgentListByQnAlias,
  LIBRARY_REUSE_TOAST,
} from "@/utils/teamKbLookup";
import { extractApiErrorMessage } from "@/utils/toolsFormUtils";
import {
  useKbQnAState,
  useKbDatasourceActions,
} from "./kb/useKbDatasourceState";
import { useIsKbBuildFlow } from "./kb/KbDatasourceModeContext";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AgentQnA() {
  const kbActions = useKbDatasourceActions();
  const isBuild = useIsKbBuildFlow();
  const readOnly = useAgentReadOnly();
  const knowledgeBaseQnA = useKbQnAState();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [alias, setAlias] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isAdding, setIsAdding] = useState(false);

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

  const handleAdd = async () => {
    if (!alias.trim() || !question.trim() || !answer.trim()) {
      return;
    }

    const trimmedAlias = alias.trim();
    const trimmedQuestion = question.trim();
    const trimmedAnswer = answer.trim();

    if (isOnAgentListByQnAlias(knowledgeBaseQnA, trimmedAlias)) {
      toast.error("An entry with this alias is already on this agent.");
      return;
    }

    setIsAdding(true);
    try {
      const libraryMatch = await findTeamQnAByAlias(trimmedAlias);

      if (libraryMatch) {
        const existingQuestion = libraryMatch.question?.trim() ?? "";
        const existingAnswer = libraryMatch.answer?.trim() ?? "";
        const contentDiffers =
          (existingQuestion && existingQuestion !== trimmedQuestion) ||
          (existingAnswer && existingAnswer !== trimmedAnswer);

        if (contentDiffers) {
          toast.warning(LIBRARY_REUSE_TOAST.qnaContentMismatch, {
            duration: 8000,
          });
        } else {
          toast.info(LIBRARY_REUSE_TOAST.qna);
        }

        kbActions.addKnowledgeBaseQnA({
          kb_id: libraryMatch.kb_id,
          qna_alias: libraryMatch.qna_alias,
          question: trimmedQuestion,
          answer: trimmedAnswer,
          lastUpdated: new Date().toISOString(),
          status: "pending_attach",
        });
      } else {
        kbActions.addKnowledgeBaseQnA({
          qna_alias: trimmedAlias,
          question: trimmedQuestion,
          answer: trimmedAnswer,
          lastUpdated: new Date().toISOString(),
          status: "new",
        });
        toast.success(
          isBuild
            ? "QnA entry added- will be indexed when you build."
            : "QnA entry added- will be indexed when you save.",
        );
      }

      resetForm();
      setDialogOpen(false);
    } catch (error: unknown) {
      toast.error(
        extractApiErrorMessage(error, "Failed to check team library for Q&A"),
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    setDialogOpen(false);
  };

  return (
    <>
      <div className="flex flex-col">
        <AgentQnAList
          onAddMore={readOnly ? undefined : () => setDialogOpen(true)}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Add QnA Entry</DialogTitle>
            <DialogDescription>
              Add a question and answer pair to your agent&apos;s knowledge
              base. If the alias already exists in your team library, the
              existing item will be attached without re-indexing.
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
                disabled={isAdding}
              >
                Done
              </CancelButton>
            </DialogClose>
            <PrimaryButton
              className="text-[12px] font-semibold flex items-center justify-center gap-2 min-w-[80px] min-h-[36px]"
              onClick={handleAdd}
              disabled={
                !alias.trim() || !question.trim() || !answer.trim() || isAdding
              }
            >
              {isAdding ? (
                <Spinner className="border-white dark:border-deep-onyx" />
              ) : (
                "Add"
              )}
            </PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
