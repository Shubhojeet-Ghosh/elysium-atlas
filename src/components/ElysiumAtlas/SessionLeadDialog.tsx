"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import CustomInput from "@/components/inputs/CustomInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Spinner from "@/components/ui/Spinner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppDispatch } from "@/store";
import { applySessionLeadUpdated } from "@/store/reducers/agentSlice";
import type { SessionLeadCollection } from "@/types/leadCollection";
import { updateSessionLead } from "@/utils/leadCollectionApi";
import { extractLeadCollectionApiError } from "@/utils/leadCollectionFormUtils";
import {
  buildSessionLeadPatch,
  mergeSessionLeadFieldValues,
  sessionLeadFieldValues,
  sessionLeadValuesEqual,
  withDerivedSessionLeadStatus,
} from "@/utils/leadCollectionSessionUtils";

interface SessionLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  chatSessionId: string;
  leadCollection?: SessionLeadCollection | null;
  canSave?: boolean;
}

const FIELD_CLASS =
  "!h-10 !min-h-10 !max-h-10 w-full box-border !rounded-[10px] !border-2 border-gray-300 bg-white !px-[12px] !py-0 !text-[13px] !font-semibold !leading-none text-deep-onyx dark:border-deep-onyx dark:bg-deep-onyx dark:text-pure-mist";

const cancelButtonClassName =
  "bg-transparent border border-gray-300 dark:border-white text-gray-700 dark:text-white text-[12px] hover:bg-white dark:hover:bg-pure-mist dark:hover:text-deep-onyx";

const saveButtonClassName =
  "min-w-[95px] text-[12px] font-semibold flex items-center justify-center gap-2";

export default function SessionLeadDialog({
  open,
  onOpenChange,
  agentId,
  chatSessionId,
  leadCollection,
  canSave = true,
}: SessionLeadDialogProps) {
  const dispatch = useAppDispatch();
  const [isSaving, setIsSaving] = useState(false);
  const [initialValues, setInitialValues] = useState<Record<string, string>>(
    {},
  );
  const [values, setValues] = useState<Record<string, string>>({});

  const sortedFields = useMemo(
    () =>
      [...(leadCollection?.fields ?? [])].sort(
        (left, right) => left.order - right.order,
      ),
    [leadCollection?.fields],
  );

  useEffect(() => {
    if (!open) return;
    const nextValues = sessionLeadFieldValues(leadCollection);
    setInitialValues(nextValues);
    setValues(nextValues);
  }, [open, leadCollection, chatSessionId]);

  const isDirty = useMemo(
    () => !sessionLeadValuesEqual(initialValues, values),
    [initialValues, values],
  );

  const handleFieldChange = useCallback((key: string, nextValue: string) => {
    setValues((current) => ({ ...current, [key]: nextValue }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!canSave) return;

    const patch = buildSessionLeadPatch(initialValues, values);
    if (Object.keys(patch).length === 0) return;

    setIsSaving(true);
    try {
      const response = await updateSessionLead({
        agent_id: agentId,
        chat_session_id: chatSessionId,
        fields: patch,
      });

      if (!response.success) {
        toast.error(response.message ?? "Unable to save lead details.");
        return;
      }

      const mergedLeadCollection = withDerivedSessionLeadStatus(
        mergeSessionLeadFieldValues(response.lead_collection, values),
      );

      dispatch(
        applySessionLeadUpdated({
          chat_session_id: chatSessionId,
          lead_collection: mergedLeadCollection,
          lead_status: mergedLeadCollection.list_status,
          lead_email: response.lead_email,
          lead_name: response.lead_name,
        }),
      );

      const savedValues = sessionLeadFieldValues(mergedLeadCollection);
      setInitialValues(savedValues);
      setValues(savedValues);
      toast.success(response.message ?? "Lead details saved.");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        extractLeadCollectionApiError(error, "Unable to save lead details."),
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    agentId,
    canSave,
    chatSessionId,
    dispatch,
    initialValues,
    onOpenChange,
    values,
  ]);

  const hasFields = sortedFields.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Lead details</DialogTitle>
          <DialogDescription>
            {canSave
              ? "View and update contact details captured for this chat session."
              : "View contact details captured for this chat session. Take over the chat to edit them."}
          </DialogDescription>
        </DialogHeader>

        {!hasFields ? (
          <p className="text-[12px] text-gray-500 dark:text-gray-400 py-2">
            No lead fields are configured for this agent yet.
          </p>
        ) : (
          <div className="grid gap-4 py-2 max-h-[70vh] overflow-y-auto">
            {sortedFields.map((field) => (
              <div key={field.key} className="grid gap-1.5">
                <label
                  htmlFor={`session-lead-${field.key}`}
                  className="font-bold text-[13px] text-deep-onyx dark:text-pure-mist"
                >
                  {field.label}
                  {field.required ? (
                    <span className="text-serene-purple ml-0.5">*</span>
                  ) : null}
                </label>
                <CustomInput
                  id={`session-lead-${field.key}`}
                  value={values[field.key] ?? ""}
                  onChange={(event) =>
                    handleFieldChange(field.key, event.target.value)
                  }
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  className={FIELD_CLASS}
                  disabled={isSaving || !canSave}
                  readOnly={!canSave}
                />
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <PrimaryButton
              className={cancelButtonClassName}
              disabled={isSaving}
            >
              {canSave ? "Cancel" : "Close"}
            </PrimaryButton>
          </DialogClose>
          {canSave ? (
            <PrimaryButton
              className={saveButtonClassName}
              onClick={handleSave}
              disabled={!hasFields || !isDirty || isSaving}
            >
              {isSaving ? (
                <Spinner className="border-white dark:border-deep-onyx" />
              ) : (
                "Save"
              )}
            </PrimaryButton>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
