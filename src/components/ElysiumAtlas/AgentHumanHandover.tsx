"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import CustomTextareaPrimary from "@/components/inputs/CustomTextareaPrimary";
import PrimaryButton from "@/components/ui/PrimaryButton";
import OutlineButton from "@/components/ui/OutlineButton";
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
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store";
import { useAgentReadOnly } from "@/hooks/useCanManageAgents";
import type { HumanHandoverConfig } from "@/types/humanHandover";
import {
  getHumanHandoverConfig,
  resetHumanHandoverConfig,
  updateHumanHandoverConfig,
} from "@/utils/humanHandoverApi";
import {
  configsAreEqual,
  extractHumanHandoverApiError,
  validateHumanHandoverForm,
} from "@/utils/humanHandoverFormUtils";
import { LEAD_COLLECTION_INSET_CLASS } from "@/utils/agentSectionUtils";

const DEFAULT_CONFIG: HumanHandoverConfig = {
  enable_human_handover: false,
  handover_trigger_prompt: "",
};

const actionButtonClassName =
  "text-[12px] font-semibold flex items-center justify-center gap-2 min-h-[41px] h-[41px] px-[16px]";

export default function AgentHumanHandover() {
  const agentID = useAppSelector((state) => state.agent.agentID);
  const isLeftNavOpen = useAppSelector((state) => state.settings.isLeftNavOpen);
  const readOnly = useAgentReadOnly();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const [savedConfig, setSavedConfig] =
    useState<HumanHandoverConfig>(DEFAULT_CONFIG);
  const [enableHumanHandover, setEnableHumanHandover] = useState(false);
  const [handoverTriggerPrompt, setHandoverTriggerPrompt] = useState("");

  const currentConfig = useMemo<HumanHandoverConfig>(
    () => ({
      enable_human_handover: enableHumanHandover,
      handover_trigger_prompt: handoverTriggerPrompt,
    }),
    [enableHumanHandover, handoverTriggerPrompt],
  );

  const hasChanges = !configsAreEqual(savedConfig, currentConfig);
  const isBusy = isSaving || isResetting;
  const formDisabled = readOnly || isBusy;

  const applyConfigToForm = useCallback((config: HumanHandoverConfig) => {
    setEnableHumanHandover(config.enable_human_handover);
    setHandoverTriggerPrompt(config.handover_trigger_prompt);
  }, []);

  const loadConfig = useCallback(async () => {
    if (!agentID) return;

    setIsLoading(true);

    try {
      const response = await getHumanHandoverConfig(agentID);

      if (!response.success) {
        toast.error(
          response.message || "Failed to load human handover settings.",
        );
        return;
      }

      const config = response.human_handover_config ?? DEFAULT_CONFIG;
      setSavedConfig(config);
      applyConfigToForm(config);
    } catch (error: unknown) {
      toast.error(
        extractHumanHandoverApiError(
          error,
          "Failed to load human handover settings.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [agentID, applyConfigToForm]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleEnableToggle = () => {
    if (formDisabled) return;
    setEnableHumanHandover((prev) => !prev);
  };

  const handleSave = async () => {
    if (!agentID || formDisabled) return;

    const validationError = validateHumanHandoverForm(currentConfig);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSaving(true);

    try {
      const response = await updateHumanHandoverConfig({
        agent_id: agentID,
        enable_human_handover: currentConfig.enable_human_handover,
        handover_trigger_prompt: currentConfig.handover_trigger_prompt,
      });

      if (!response.success) {
        toast.error(
          response.message || "Failed to save human handover settings.",
        );
        return;
      }

      const updatedConfig = response.human_handover_config ?? currentConfig;
      setSavedConfig(updatedConfig);
      applyConfigToForm(updatedConfig);
      toast.success(
        response.message || "Human handover settings saved successfully.",
      );
    } catch (error: unknown) {
      toast.error(
        extractHumanHandoverApiError(
          error,
          "Failed to save human handover settings.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!agentID || formDisabled) return;

    setIsResetting(true);

    try {
      const response = await resetHumanHandoverConfig({ agent_id: agentID });

      if (!response.success) {
        toast.error(
          response.message || "Failed to reset human handover settings.",
        );
        return;
      }

      const resetConfig = response.human_handover_config ?? DEFAULT_CONFIG;
      setSavedConfig(resetConfig);
      applyConfigToForm(resetConfig);
      setResetConfirmOpen(false);
      toast.success(
        response.message || "Human handover settings reset to defaults.",
      );
    } catch (error: unknown) {
      toast.error(
        extractHumanHandoverApiError(
          error,
          "Failed to reset human handover settings.",
        ),
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <div
        className={`w-full min-w-0 max-w-full lg:mt-8 mt-5 pb-28 overflow-x-hidden ${LEAD_COLLECTION_INSET_CLASS}`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <div className="w-full grid gap-6">
            {readOnly && (
              <p className="text-[14px] font-medium text-gray-500 dark:text-gray-400">
                You have view-only access to this agent. Ask a team owner or
                admin to update human handover settings.
              </p>
            )}

            <section className="grid gap-3">
              <p className="text-[18px] font-bold text-deep-onyx dark:text-pure-mist">
                General
              </p>
              <div className="flex items-center justify-between gap-4">
                <div className="grid gap-1 min-w-0">
                  <p className="font-bold text-[14px]">
                    Enable human handover
                  </p>
                  <p className="text-[14px] text-gray-500 dark:text-gray-400">
                    When enabled, the AI detects when a visitor wants to speak
                    with a person. The chat is flagged on your team dashboard,
                    the visitor sees a confirmation, and a name/email form is
                    shown so you can follow up if they leave before someone
                    joins.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enableHumanHandover}
                  aria-label={
                    enableHumanHandover
                      ? "Turn off human handover"
                      : "Turn on human handover"
                  }
                  disabled={formDisabled}
                  onClick={handleEnableToggle}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-serene-purple/50",
                    enableHumanHandover
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
                      enableHumanHandover ? "translate-x-5" : "translate-x-0",
                    )}
                  />
                </button>
              </div>
            </section>

            {enableHumanHandover && (
              <section className="grid gap-3">
                <p className="text-[18px] font-bold text-deep-onyx dark:text-pure-mist">
                  When to hand over
                </p>
                <div className="grid gap-1.5">
                  <p className="font-bold text-[14px]">
                    When should your agent offer a human handover?
                  </p>
                  <CustomTextareaPrimary
                    value={handoverTriggerPrompt}
                    onChange={(event) =>
                      setHandoverTriggerPrompt(event.target.value)
                    }
                    placeholder="Example: Detect when the visitor explicitly asks to speak with a human, real person, live agent, or representative, or expresses frustration that requires human help."
                    rows={4}
                    resizable
                    disabled={formDisabled}
                    className="!text-[14px]"
                  />
                  <p className="text-[14px] text-gray-500 dark:text-gray-400">
                    Define when the agent should flag a chat for human handover.
                    Must be 10–500 characters.
                  </p>
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <Dialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Reset to default settings?</DialogTitle>
            <DialogDescription>
              This turns off human handover and clears your trigger rules. You
              can set everything up again anytime.
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
