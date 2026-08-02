"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import CustomInput from "@/components/inputs/CustomInput";
import CustomTextareaPrimary from "@/components/inputs/CustomTextareaPrimary";
import PrimaryButton from "@/components/ui/PrimaryButton";
import OutlineButton from "@/components/ui/OutlineButton";
import Spinner from "@/components/ui/Spinner";
import InfoIcon from "@/components/ui/InfoIcon";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store";
import { useAgentReadOnly } from "@/hooks/useCanManageAgents";
import type {
  LeadCollectionConfig,
  LeadCollectionFieldRow,
  LeadFieldCatalogItem,
} from "@/types/leadCollection";
import {
  getLeadCollectionConfig,
  resetLeadCollectionConfig,
  updateLeadCollectionConfig,
} from "@/utils/leadCollectionApi";
import {
  configsAreEqual,
  createDefaultFieldRows,
  extractLeadCollectionApiError,
  fieldsToRows,
  findCatalogItemByLabel,
  getFieldDisplayLabel,
  getNextUnusedCatalogKey,
  rowsToFields,
  validateLeadCollectionForm,
} from "@/utils/leadCollectionFormUtils";
import { LEAD_COLLECTION_INSET_CLASS } from "@/utils/agentSectionUtils";

const TIMING_INPUT_CLASS =
  "!h-9 !min-h-9 !max-h-9 !w-[72px] !max-w-[72px] shrink-0 box-border !rounded-[10px] !border-2 border-gray-300 bg-white !px-[10px] !py-0 !text-[14px] !font-semibold !leading-none text-center text-deep-onyx dark:border-deep-onyx dark:bg-deep-onyx dark:text-pure-mist [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

const DIALOG_INPUT_CLASS =
  "!h-10 !min-h-10 !max-h-10 w-full box-border !rounded-[10px] !border-2 border-gray-300 bg-white !px-[12px] !py-0 !text-[14px] !font-semibold !leading-none text-deep-onyx dark:border-deep-onyx dark:bg-deep-onyx dark:text-pure-mist";

const DEFAULT_CONFIG: LeadCollectionConfig = {
  enable_lead_capturing: false,
  collection_trigger_prompt: "",
  min_messages_before_ask: 2,
  fields: [],
};

const actionButtonClassName =
  "text-[12px] font-semibold flex items-center justify-center gap-2 min-h-[41px] h-[41px] px-[16px]";

const MIN_MESSAGES_MIN = 1;
const MIN_MESSAGES_MAX = 50;

function clampMinMessages(value: number) {
  return Math.min(MIN_MESSAGES_MAX, Math.max(MIN_MESSAGES_MIN, value));
}

function parseNumericInput(raw: string): number | null {
  const digitsOnly = raw.replace(/\D/g, "");
  if (!digitsOnly) return null;
  return Number.parseInt(digitsOnly, 10);
}

function blockNonNumericKey(event: KeyboardEvent<HTMLInputElement>) {
  if (["e", "E", "+", "-", ".", ","].includes(event.key)) {
    event.preventDefault();
  }
}

function LeadCollectionFieldEditor({
  row,
  index,
  catalog,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  disabled,
}: {
  row: LeadCollectionFieldRow;
  index: number;
  catalog: LeadFieldCatalogItem[];
  onChange: (row: LeadCollectionFieldRow) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  disabled?: boolean;
}) {
  const fieldLabel = getFieldDisplayLabel(row, catalog);

  return (
    <div className="group py-5 border-b border-gray-100 dark:border-white/10 last:border-b-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-serene-purple/10 text-[13px] font-semibold leading-none text-serene-purple"
            aria-label={`Field order ${index + 1}`}
          >
            {index + 1}
          </span>
          <span className="min-w-0 truncate font-bold text-[14px] leading-none text-deep-onyx dark:text-pure-mist">
            {fieldLabel}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end sm:shrink-0 pl-12 sm:pl-0">
          <label
            className="inline-flex items-center gap-2 text-[12px] font-medium leading-none text-deep-onyx dark:text-pure-mist cursor-pointer shrink-0"
            title="The visitor must fill this in before the lead is marked complete"
          >
            <Checkbox
              checked={row.required}
              onCheckedChange={(checked) =>
                onChange({ ...row, required: checked === true })
              }
              disabled={disabled}
              className="shrink-0"
            />
            Required
          </label>

          <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={disabled || !canMoveUp}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:text-serene-purple hover:bg-serene-purple/10 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label={`Move ${fieldLabel} up`}
          >
            <ChevronUp size={18} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={disabled || !canMoveDown}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:text-serene-purple hover:bg-serene-purple/10 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label={`Move ${fieldLabel} down`}
          >
            <ChevronDown size={18} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:text-danger-red hover:bg-danger-red/10 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label={`Remove ${fieldLabel}`}
          >
            <Trash2 size={16} />
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgentLeadCollection() {
  const agentID = useAppSelector((state) => state.agent.agentID);
  const isLeftNavOpen = useAppSelector((state) => state.settings.isLeftNavOpen);
  const readOnly = useAgentReadOnly();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [customFieldDialogOpen, setCustomFieldDialogOpen] = useState(false);
  const [customFieldLabel, setCustomFieldLabel] = useState("");
  const [customFieldError, setCustomFieldError] = useState<string | null>(null);

  const [fieldCatalog, setFieldCatalog] = useState<LeadFieldCatalogItem[]>([]);
  const [savedConfig, setSavedConfig] =
    useState<LeadCollectionConfig>(DEFAULT_CONFIG);
  const [enableLeadCapturing, setEnableLeadCapturing] = useState(false);
  const [collectionTriggerPrompt, setCollectionTriggerPrompt] = useState("");
  const [minMessagesBeforeAsk, setMinMessagesBeforeAsk] = useState(2);
  const [fieldRows, setFieldRows] = useState<LeadCollectionFieldRow[]>([]);

  const currentConfig = useMemo<LeadCollectionConfig>(
    () => ({
      enable_lead_capturing: enableLeadCapturing,
      collection_trigger_prompt: collectionTriggerPrompt,
      min_messages_before_ask: minMessagesBeforeAsk,
      fields: rowsToFields(fieldRows),
    }),
    [
      enableLeadCapturing,
      collectionTriggerPrompt,
      minMessagesBeforeAsk,
      fieldRows,
    ],
  );

  const hasChanges = !configsAreEqual(savedConfig, currentConfig);
  const isBusy = isSaving || isResetting;
  const formDisabled = readOnly || isBusy;

  const applyConfigToForm = useCallback(
    (config: LeadCollectionConfig, catalog: LeadFieldCatalogItem[]) => {
      setEnableLeadCapturing(config.enable_lead_capturing);
      setCollectionTriggerPrompt(config.collection_trigger_prompt);
      setMinMessagesBeforeAsk(config.min_messages_before_ask);

      const fields =
        config.fields.length > 0
          ? config.fields
          : config.enable_lead_capturing
            ? rowsToFields(createDefaultFieldRows(catalog))
            : [];

      setFieldRows(fieldsToRows(fields));
    },
    [],
  );

  const loadConfig = useCallback(async () => {
    if (!agentID) return;

    setIsLoading(true);

    try {
      const response = await getLeadCollectionConfig(agentID);

      if (!response.success) {
        toast.error(response.message || "Failed to load lead collection settings.");
        return;
      }

      const config = response.lead_collection_config ?? DEFAULT_CONFIG;
      const catalog = response.field_catalog ?? [];
      setFieldCatalog(catalog);
      setSavedConfig(config);
      applyConfigToForm(config, catalog);
    } catch (error: unknown) {
      toast.error(
        extractLeadCollectionApiError(
          error,
          "Failed to load lead collection settings.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [agentID, applyConfigToForm]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleEnableLeadCapturingToggle = () => {
    if (formDisabled) return;

    setEnableLeadCapturing((prev) => {
      const next = !prev;
      if (next && fieldRows.length === 0) {
        setFieldRows(createDefaultFieldRows(fieldCatalog));
      }
      return next;
    });
  };

  const openCustomFieldDialog = () => {
    setCustomFieldLabel("");
    setCustomFieldError(null);
    setCustomFieldDialogOpen(true);
  };

  const handleCustomFieldDialogOpenChange = (open: boolean) => {
    setCustomFieldDialogOpen(open);
    if (!open) {
      setCustomFieldLabel("");
      setCustomFieldError(null);
    }
  };

  const handleAddCustomField = () => {
    const label = customFieldLabel.trim();
    if (!label) {
      setCustomFieldError("Please enter a field name.");
      return;
    }

    const usedKeys = fieldRows.map((row) => row.key);
    const matched = findCatalogItemByLabel(fieldCatalog, label, usedKeys);
    const nextKey = matched?.key ?? getNextUnusedCatalogKey(fieldCatalog, usedKeys);

    if (!nextKey) {
      toast.error("You have already added every available field.");
      return;
    }

    setFieldRows((prev) => [
      ...prev,
      {
        id: uuidv4(),
        key: nextKey,
        required: false,
        order: prev.length + 1,
        customLabel: matched ? undefined : label,
      },
    ]);

    setCustomFieldDialogOpen(false);
    setCustomFieldLabel("");
    setCustomFieldError(null);
  };

  const moveField = (index: number, direction: "up" | "down") => {
    setFieldRows((prev) => {
      const next = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;

      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const handleMinMessagesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = parseNumericInput(event.target.value);
    if (parsed === null) {
      setMinMessagesBeforeAsk(MIN_MESSAGES_MIN);
      return;
    }
    setMinMessagesBeforeAsk(Math.min(MIN_MESSAGES_MAX, parsed));
  };

  const handleMinMessagesBlur = () => {
    setMinMessagesBeforeAsk((value) => clampMinMessages(value));
  };

  const handleSave = async () => {
    if (!agentID || formDisabled) return;

    const validationError = validateLeadCollectionForm(currentConfig);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSaving(true);

    try {
      const response = await updateLeadCollectionConfig({
        agent_id: agentID,
        enable_lead_capturing: currentConfig.enable_lead_capturing,
        collection_trigger_prompt: currentConfig.collection_trigger_prompt,
        min_messages_before_ask: currentConfig.min_messages_before_ask,
        fields: currentConfig.fields,
      });

      if (!response.success) {
        toast.error(response.message || "Failed to save lead collection settings.");
        return;
      }

      const updatedConfig =
        response.lead_collection_config ?? currentConfig;
      setSavedConfig(updatedConfig);
      applyConfigToForm(updatedConfig, fieldCatalog);
      toast.success(
        response.message || "Lead collection settings saved successfully.",
      );
    } catch (error: unknown) {
      const message = extractLeadCollectionApiError(
        error,
        "Failed to save lead collection settings.",
      );
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!agentID || formDisabled) return;

    setIsResetting(true);

    try {
      const response = await resetLeadCollectionConfig({ agent_id: agentID });

      if (!response.success) {
        toast.error(response.message || "Failed to reset lead collection settings.");
        return;
      }

      const resetConfig =
        response.lead_collection_config ?? DEFAULT_CONFIG;
      setSavedConfig(resetConfig);
      applyConfigToForm(resetConfig, fieldCatalog);
      setResetConfirmOpen(false);
      toast.success(
        response.message || "Lead collection settings reset to defaults.",
      );
    } catch (error: unknown) {
      toast.error(
        extractLeadCollectionApiError(
          error,
          "Failed to reset lead collection settings.",
        ),
      );
    } finally {
      setIsResetting(false);
    }
  };

  const usedKeys = fieldRows.map((row) => row.key);
  const canAddField = fieldCatalog.some(
    (item) => !usedKeys.includes(item.key),
  );

  return (
    <>
      <div className={`w-full min-w-0 max-w-full lg:mt-8 mt-5 pb-28 overflow-x-hidden ${LEAD_COLLECTION_INSET_CLASS}`}>
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="w-full grid gap-6">
          {readOnly && (
            <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400">
              You have view-only access to this agent. Ask a team owner or admin
              to update lead collection settings.
            </p>
          )}

          <section className="grid gap-3">
            <p className="text-[18px] font-bold text-deep-onyx dark:text-pure-mist">
              General
            </p>
            <div className="flex items-center justify-between gap-4">
              <div className="grid gap-1 min-w-0">
                <p className="font-bold text-[14px]">Turn on lead collection</p>
                <p className="text-[14px] text-gray-500 dark:text-gray-400">
                  When enabled, your agent can ask visitors for contact details
                  during chat — such as email, name, or phone — using the rules
                  you set below.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={enableLeadCapturing}
                aria-label={
                  enableLeadCapturing
                    ? "Turn off lead collection"
                    : "Turn on lead collection"
                }
                disabled={formDisabled}
                onClick={handleEnableLeadCapturingToggle}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-serene-purple/50",
                  enableLeadCapturing
                    ? "bg-serene-purple"
                    : "bg-gray-300 dark:bg-gray-600",
                  formDisabled
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer",
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
                    enableLeadCapturing ? "translate-x-5" : "translate-x-0",
                  )}
                />
              </button>
            </div>
          </section>

          {enableLeadCapturing && (
            <>
              <section className="grid gap-3">
                <p className="text-[18px] font-bold text-deep-onyx dark:text-pure-mist">
                  When to ask
                </p>
                <div className="grid gap-1.5">
                  <p className="font-bold text-[14px]">
                    When should your agent ask for contact details?
                  </p>
                  <CustomTextareaPrimary
                    value={collectionTriggerPrompt}
                    onChange={(event) =>
                      setCollectionTriggerPrompt(event.target.value)
                    }
                    placeholder="Example: Ask when someone wants pricing, a demo, a quote, a callback, or help that needs a follow-up from your team."
                    rows={4}
                    resizable
                    disabled={formDisabled}
                    className="!text-[14px]"
                  />
                  <p className="text-[14px] text-gray-500 dark:text-gray-400">
                    Describe the situation in everyday language. Your agent uses
                    this to decide the right moment to ask. Between 10 and 500
                    characters.
                  </p>
                </div>
              </section>

              <section className="grid gap-3">
                <p className="text-[18px] font-bold text-deep-onyx dark:text-pure-mist">
                  Timing
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="font-bold text-[14px]">
                      How many visitor messages first?
                    </p>
                    <InfoIcon text="Your agent waits until the visitor sends at least this many messages before checking your trigger rules above. This helps avoid asking for details too early in the conversation. Enter a number from 1 to 50." />
                  </div>
                  <CustomInput
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={String(minMessagesBeforeAsk)}
                    onChange={handleMinMessagesChange}
                    onBlur={handleMinMessagesBlur}
                    onKeyDown={blockNonNumericKey}
                    onPaste={(event) => {
                      event.preventDefault();
                      const pasted = event.clipboardData.getData("text");
                      const parsed = parseNumericInput(pasted);
                      if (parsed !== null) {
                        setMinMessagesBeforeAsk(
                          Math.min(MIN_MESSAGES_MAX, parsed),
                        );
                      }
                    }}
                    disabled={formDisabled}
                    className={TIMING_INPUT_CLASS}
                    aria-label="How many visitor messages before ask"
                  />
                </div>
              </section>

              <section className="grid gap-4">
                <div className="grid gap-1">
                <p className="text-[18px] font-bold text-deep-onyx dark:text-pure-mist">
                  What to collect
                </p>
                  <p className="text-[14px] text-gray-500 dark:text-gray-400">
                    Choose what details your agent collects and in what order.
                    Email, name, and phone are included by default. Mark a field
                    as required if the visitor must provide it before the lead is
                    complete.
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50/70 dark:bg-white/[0.03] px-3 sm:px-6 min-w-0 overflow-hidden">
                  {fieldRows.map((row, index) => (
                    <LeadCollectionFieldEditor
                      key={row.id}
                      row={row}
                      index={index}
                      catalog={fieldCatalog}
                      onChange={(updated) =>
                        setFieldRows((prev) =>
                          prev.map((item) =>
                            item.id === row.id ? updated : item,
                          ),
                        )
                      }
                      onRemove={() =>
                        setFieldRows((prev) =>
                          prev.filter((item) => item.id !== row.id),
                        )
                      }
                      onMoveUp={() => moveField(index, "up")}
                      onMoveDown={() => moveField(index, "down")}
                      canMoveUp={index > 0}
                      canMoveDown={index < fieldRows.length - 1}
                      disabled={formDisabled}
                    />
                  ))}
                </div>

                {!formDisabled && canAddField && (
                  <div className="flex justify-end">
                    <OutlineButton
                      className={`${actionButtonClassName} !py-0 border-[2px] shrink-0`}
                      onClick={openCustomFieldDialog}
                    >
                      <Plus size={14} />
                      Add another field
                    </OutlineButton>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      )}

      </div>

      <Dialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Reset to default settings?</DialogTitle>
            <DialogDescription>
              This turns off lead collection and clears your trigger rules and
              field list. You can set everything up again anytime.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <PrimaryButton
                className="bg-transparent border border-gray-300 dark:border-white text-gray-700 dark:text-white text-[12px] hover:bg-white dark:hover:bg-pure-mist dark:hover:text-deep-onyx"
                disabled={isResetting}
              >
                Cancel
              </PrimaryButton>
            </DialogClose>
            <PrimaryButton
              className={`${actionButtonClassName} !py-0`}
              onClick={handleReset}
              disabled={isResetting}
            >
              {isResetting ? (
                <Spinner className="border-white dark:border-deep-onyx" />
              ) : (
                "Reset"
              )}
            </PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={customFieldDialogOpen}
        onOpenChange={handleCustomFieldDialogOpenChange}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add another field</DialogTitle>
            <DialogDescription>
              Name the detail you want your agent to ask for — for example,
              company name or what the visitor is interested in.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5 py-4">
            <p className="font-bold text-[14px]">Field name</p>
            <CustomInput
              value={customFieldLabel}
              onChange={(event) => {
                setCustomFieldLabel(event.target.value);
                if (customFieldError) setCustomFieldError(null);
              }}
              placeholder="e.g. Company name"
              disabled={formDisabled}
              className={DIALOG_INPUT_CLASS}
            />
            {customFieldError && (
              <p className="text-[12px] text-danger-red font-medium">
                {customFieldError}
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <PrimaryButton
                className="bg-transparent border border-gray-300 dark:border-white text-gray-700 dark:text-white text-[12px] hover:bg-white dark:hover:bg-pure-mist dark:hover:text-deep-onyx"
              >
                Cancel
              </PrimaryButton>
            </DialogClose>
            <PrimaryButton
              className={`${actionButtonClassName} !py-0`}
              onClick={handleAddCustomField}
              disabled={formDisabled}
            >
              Done
            </PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!readOnly && !isLoading && (
        <div
          className={cn(
            "fixed bottom-0 right-0 z-40 py-4 bg-white/95 backdrop-blur-sm dark:bg-[#0a0a0a]/95",
            isLeftNavOpen ? "left-0 lg:left-[280px]" : "left-0 lg:left-20",
          )}
        >
          <div className="px-4 lg:px-[50px] min-w-0">
            <div
              className={`${LEAD_COLLECTION_INSET_CLASS} flex flex-wrap items-center justify-end gap-2`}
            >
              <OutlineButton
                className={`${actionButtonClassName} !py-0 border-[2px] shrink-0 bg-white dark:bg-[#0a0a0a]`}
                disabled={isBusy}
                onClick={() => setResetConfirmOpen(true)}
              >
                Reset to defaults
              </OutlineButton>
              <PrimaryButton
                className={`${actionButtonClassName} !py-0 bg-serene-purple relative`}
                onClick={handleSave}
                disabled={isBusy || !hasChanges}
              >
                <span className={cn(isSaving && "invisible")}>Save changes</span>
                {isSaving && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Spinner className="border-white dark:border-deep-onyx" />
                  </span>
                )}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
