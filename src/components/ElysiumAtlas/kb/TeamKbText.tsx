"use client";

import { useCallback, useEffect, useState } from "react";
import CustomInput from "@/components/inputs/CustomInput";
import CustomTextareaPrimary from "@/components/inputs/CustomTextareaPrimary";
import PrimaryButton from "@/components/ui/PrimaryButton";
import InfoIcon from "@/components/ui/InfoIcon";
import CancelButton from "@/components/ui/CancelButton";
import TeamKbTextList from "./TeamKbTextList";
import { toast } from "sonner";
import { useActiveTeamRole } from "@/hooks/useActiveTeamRole";
import { canManageTeamMembers } from "@/utils/teamPermissions";
import { createCustomText, updateCustomText } from "@/utils/kbItemsApi";
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

export interface PendingNewText {
  custom_text_alias: string;
  content: string;
}

export interface PendingTextUpdate {
  kb_id: string;
  custom_text_alias: string;
  content: string;
}

export default function TeamKbText() {
  const teamRole = useActiveTeamRole();
  const readOnly = !canManageTeamMembers(teamRole);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [alias, setAlias] = useState("");
  const [text, setText] = useState("");
  const [pendingNew, setPendingNew] = useState<PendingNewText[]>([]);
  const [pendingUpdates, setPendingUpdates] = useState<PendingTextUpdate[]>(
    [],
  );
  const [refreshKey, setRefreshKey] = useState(0);

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

  const handleAdd = () => {
    if (!alias.trim() || !text.trim()) {
      return;
    }

    const trimmedAlias = alias.trim();
    const duplicateExists = pendingNew.some(
      (item) =>
        item.custom_text_alias.toLowerCase() === trimmedAlias.toLowerCase(),
    );

    if (duplicateExists) {
      toast.error(
        "An entry with this alias name already exists. Please use a different alias.",
      );
      return;
    }

    setPendingNew((prev) => [
      { custom_text_alias: trimmedAlias, content: text.trim() },
      ...prev,
    ]);
    resetForm();
    setDialogOpen(false);
    toast.success("Text entry added");
  };

  const handleCancel = () => {
    resetForm();
    setDialogOpen(false);
  };

  const indexPendingTexts = useCallback(async () => {
    for (const item of pendingNew) {
      const response = await createCustomText(
        item.custom_text_alias,
        item.content,
      );
      if (!response.success) {
        throw new Error(response.message || "Failed to create text entry");
      }
    }

    for (const item of pendingUpdates) {
      const response = await updateCustomText(
        item.kb_id,
        item.custom_text_alias,
        item.content,
      );
      if (!response.success) {
        throw new Error(response.message || "Failed to update text entry");
      }
    }

    setPendingNew([]);
    setPendingUpdates([]);
    setRefreshKey((k) => k + 1);
    toast.success("Text entries indexed");
  }, [pendingNew, pendingUpdates]);

  const clearPendingTexts = useCallback(() => {
    setPendingNew([]);
    setPendingUpdates([]);
  }, []);

  const notifyPendingChange = useKbPendingRegistration(
    "text",
    {
      hasPending: () => pendingNew.length > 0 || pendingUpdates.length > 0,
      getPendingCount: () => pendingNew.length + pendingUpdates.length,
      onIndex: indexPendingTexts,
      onClear: clearPendingTexts,
    },
    [pendingNew, pendingUpdates, indexPendingTexts, clearPendingTexts],
  );

  useEffect(() => {
    notifyPendingChange();
  }, [pendingNew, pendingUpdates, notifyPendingChange]);

  return (
    <>
      <div className="flex flex-col">
        <TeamKbTextList
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
              prev.filter((item) => item.custom_text_alias !== aliasName),
            );
          }}
          onClearPendingUpdate={(kbId) => {
            setPendingUpdates((prev) =>
              prev.filter((item) => item.kb_id !== kbId),
            );
          }}
          onAddMore={readOnly ? undefined : () => setDialogOpen(true)}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Add Text Entry</DialogTitle>
            <DialogDescription>
              Add custom text to your team&apos;s knowledge base.
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
              >
                Done
              </CancelButton>
            </DialogClose>
            <PrimaryButton
              className="text-[12px] font-semibold flex items-center justify-center gap-2 min-w-[80px] min-h-[36px]"
              onClick={handleAdd}
              disabled={!alias.trim() || !text.trim()}
            >
              Add
            </PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
