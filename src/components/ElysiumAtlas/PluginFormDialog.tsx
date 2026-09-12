"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { Puzzle } from "lucide-react";
import { toast } from "sonner";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Spinner from "@/components/ui/Spinner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createPlugin,
  getPlugin,
  updatePlugin,
} from "@/utils/pluginsApi";
import { DEFAULT_PLUGIN_STUB } from "@/utils/pluginStub";
import { extractApiErrorMessage } from "@/utils/toolsFormUtils";

interface PluginFormDialogProps {
  mode: "create" | "edit" | "view";
  pluginId?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function PluginFormDialog({
  mode,
  pluginId,
  trigger,
  open: controlledOpen,
  onOpenChange,
  onSuccess,
}: PluginFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [isLoadingPlugin, setIsLoadingPlugin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [pythonCode, setPythonCode] = useState(DEFAULT_PLUGIN_STUB);
  const [isActive, setIsActive] = useState(true);

  const isReadOnly = mode === "view";

  const resetForm = () => {
    setPythonCode(DEFAULT_PLUGIN_STUB);
    setIsActive(true);
    setInlineError(null);
  };

  const loadPlugin = async (id: string) => {
    setIsLoadingPlugin(true);
    try {
      const response = await getPlugin(id);
      if (response.success && response.plugin) {
        setPythonCode(response.plugin.python_code ?? "");
        setIsActive(response.plugin.is_active);
        return;
      }
      toast.error(response.message || "Failed to load plugin.");
      setOpen(false);
    } catch (error: unknown) {
      toast.error(extractApiErrorMessage(error, "Failed to load plugin."));
      setOpen(false);
    } finally {
      setIsLoadingPlugin(false);
    }
  };

  useEffect(() => {
    if (open && (mode === "edit" || mode === "view") && pluginId) {
      loadPlugin(pluginId);
    }
    if (!open) {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, pluginId]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) resetForm();
  };

  const handleCodeKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key !== "Tab") return;
    event.preventDefault();
    const target = event.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const indent = "    ";
    const next = pythonCode.slice(0, start) + indent + pythonCode.slice(end);
    setPythonCode(next);
    requestAnimationFrame(() => {
      target.selectionStart = target.selectionEnd = start + indent.length;
    });
  };

  const handleSubmit = async () => {
    if (isReadOnly) return;
    if (!pythonCode.trim()) {
      setInlineError("Plugin file cannot be empty.");
      return;
    }
    setInlineError(null);
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        const response = await createPlugin({ python_code: pythonCode });
        if (response.success) {
          toast.success("Plugin created successfully.");
          setOpen(false);
          onSuccess?.();
          return;
        }
        toast.error(response.message || "Failed to create plugin.");
      } else if (pluginId) {
        const response = await updatePlugin({
          plugin_id: pluginId,
          python_code: pythonCode,
          is_active: isActive,
        });
        if (response.success) {
          toast.success("Plugin updated successfully.");
          setOpen(false);
          onSuccess?.();
          return;
        }
        toast.error(response.message || "Failed to update plugin.");
      }
    } catch (error: unknown) {
      toast.error(
        extractApiErrorMessage(
          error,
          mode === "create"
            ? "Failed to create plugin."
            : "Failed to update plugin.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const title =
    mode === "create"
      ? "Add plugin"
      : mode === "view"
        ? "View plugin"
        : "Edit plugin";

  const description =
    mode === "create"
      ? "The file is the tool. Name, description, and inputs are parsed from PLUGIN_NAME, PLUGIN_DISPLAY_NAME, PLUGIN_DESCRIPTION, and PluginInputs."
      : mode === "view"
        ? "Team members can view plugin files. Only owners and admins can change them."
        : "Update the plugin file. Name, description, and inputs are parsed from the file on save.";

  const dialogContent = (
    <DialogContent className="sm:max-w-[760px] h-[85vh] max-h-[90vh] overflow-hidden flex flex-col">
      <div className="shrink-0 space-y-3 bg-background pr-6 pb-3 border-b border-gray-200 dark:border-deep-onyx">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {inlineError && (
          <p className="text-[12px] text-danger-red font-medium">
            {inlineError}
          </p>
        )}
      </div>

      {isLoadingPlugin ? (
        <div className="flex flex-1 items-center justify-center py-12 min-h-0">
          <Spinner />
        </div>
      ) : (
        <div className="flex flex-col gap-3 min-h-0 flex-1 overflow-hidden py-1">
          <p className="font-bold text-[13px] shrink-0">Plugin file</p>
          <div className="relative min-h-0 flex-1">
            <textarea
              value={pythonCode}
              onChange={(event) => setPythonCode(event.target.value)}
              onKeyDown={handleCodeKeyDown}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              readOnly={isReadOnly || isSubmitting}
              disabled={isSubmitting}
              className="absolute inset-0 font-mono !font-[500] text-[12px] leading-[1.55] border-gray-300 dark:border-deep-onyx border-[2px] rounded-[10px] px-[12px] py-[12px] placeholder-gray-400 focus:outline-none focus:border-serene-purple dark:focus:border-serene-purple transition duration-300 ease-in-out w-full h-full resize-none overflow-y-auto bg-white dark:bg-deep-onyx text-deep-onyx dark:text-pure-mist disabled:opacity-70"
            />
          </div>
          {mode === "edit" && (
            <label className="flex items-center justify-end gap-2 text-[13px] font-medium text-deep-onyx dark:text-pure-mist cursor-pointer shrink-0">
              Active
              <Checkbox
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked === true)}
                disabled={isSubmitting}
              />
            </label>
          )}
        </div>
      )}

      <DialogFooter className="shrink-0">
        <DialogClose asChild>
          <PrimaryButton
            className="bg-transparent border border-gray-300 dark:border-white text-gray-700 dark:text-white text-[12px] hover:bg-white dark:hover:bg-pure-mist dark:hover:text-deep-onyx"
            disabled={isSubmitting}
          >
            {isReadOnly ? "Close" : "Cancel"}
          </PrimaryButton>
        </DialogClose>
        {!isReadOnly && (
          <PrimaryButton
            className="min-w-[95px] text-[12px] font-semibold flex items-center gap-2"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoadingPlugin}
          >
            {isSubmitting ? (
              <Spinner className="border-white dark:border-deep-onyx" />
            ) : mode === "create" ? (
              "Create"
            ) : (
              "Update"
            )}
          </PrimaryButton>
        )}
      </DialogFooter>
    </DialogContent>
  );

  if (mode === "create") {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          {trigger ?? (
            <PrimaryButton className="text-[12px] font-semibold flex items-center gap-2">
              <Puzzle size={14} />
              Add plugin
            </PrimaryButton>
          )}
        </DialogTrigger>
        {dialogContent}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {dialogContent}
    </Dialog>
  );
}
