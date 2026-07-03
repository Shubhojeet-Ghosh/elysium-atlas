"use client";
import { useState } from "react";
import CustomInput from "@/components/inputs/CustomInput";
import CustomTextareaPrimary from "@/components/inputs/CustomTextareaPrimary";
import PrimaryButton from "@/components/ui/PrimaryButton";
import InfoIcon from "@/components/ui/InfoIcon";
import CancelButton from "../ui/CancelButton";
import AgentTextList from "./AgentTextList";
import { toast } from "sonner";
import { useAgentReadOnly } from "@/hooks/useCanManageAgents";
import Spinner from "@/components/ui/Spinner";
import {
  findTeamCustomTextByAlias,
  isOnAgentListByTextAlias,
  LIBRARY_REUSE_TOAST,
} from "@/utils/teamKbLookup";
import { extractApiErrorMessage } from "@/utils/toolsFormUtils";
import {
  useKbTextState,
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

export default function AgentText() {
  const kbActions = useKbDatasourceActions();
  const isBuild = useIsKbBuildFlow();
  const readOnly = useAgentReadOnly();
  const knowledgeBaseText = useKbTextState();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [alias, setAlias] = useState("");
  const [text, setText] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const resetForm = () => {
    setAlias("");
    setText("");
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setDialogOpen(open);
  };

  const handleAdd = async () => {
    if (!alias.trim() || !text.trim()) {
      return;
    }

    const trimmedAlias = alias.trim();
    const trimmedText = text.trim();

    if (isOnAgentListByTextAlias(knowledgeBaseText, trimmedAlias)) {
      toast.error("An entry with this alias is already on this agent.");
      return;
    }

    setIsAdding(true);
    try {
      const libraryMatch = await findTeamCustomTextByAlias(trimmedAlias);

      if (libraryMatch) {
        const existingContent = libraryMatch.content?.trim() ?? "";
        if (existingContent && existingContent !== trimmedText) {
          toast.warning(LIBRARY_REUSE_TOAST.textContentMismatch, {
            duration: 8000,
          });
        } else {
          toast.info(LIBRARY_REUSE_TOAST.text);
        }

        kbActions.addKnowledgeBaseText({
          kb_id: libraryMatch.kb_id,
          custom_text_alias: libraryMatch.custom_text_alias,
          custom_text: trimmedText,
          lastUpdated: new Date().toISOString(),
          status: "pending_attach",
        });
      } else {
        kbActions.addKnowledgeBaseText({
          custom_text_alias: trimmedAlias,
          custom_text: trimmedText,
          lastUpdated: new Date().toISOString(),
          status: "new",
        });
        toast.success(
          isBuild
            ? "Text entry added- will be indexed when you build."
            : "Text entry added- will be indexed when you save.",
        );
      }

      resetForm();
      setDialogOpen(false);
    } catch (error: unknown) {
      toast.error(
        extractApiErrorMessage(error, "Failed to check team library for text"),
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
        <AgentTextList
          onAddMore={readOnly ? undefined : () => setDialogOpen(true)}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Add Text Entry</DialogTitle>
            <DialogDescription>
              Add custom text to your agent&apos;s knowledge base. If the alias
              already exists in your team library, the existing item will be
              attached without re-indexing.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-[16px] py-2">
            <div className="flex flex-col gap-[4px]">
              <div className="lg:text-[14px] text-[12px] font-bold mt-[4px] flex items-center gap-1.5">
                <span>
                  Text alias <span className="text-danger-red">*</span>
                </span>
                <InfoIcon
                  className="text-[12px]"
                  text="A text alias is a short name or identifier for your custom text entry. It helps you organize and identify different text entries easily."
                />
              </div>
              <CustomInput
                type="text"
                placeholder="Enter text alias"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                className="w-full px-[12px] py-[10px]"
              />
            </div>
            <div className="flex flex-col gap-[4px]">
              <div className="lg:text-[14px] text-[12px] font-bold mt-[4px]">
                Text <span className="text-danger-red">*</span>
              </div>
              <CustomTextareaPrimary
                placeholder="Enter your custom text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full"
                rows={6}
              />
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
              disabled={!alias.trim() || !text.trim() || isAdding}
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
