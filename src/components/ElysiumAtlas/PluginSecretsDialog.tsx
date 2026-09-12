"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
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
import { getPlugin, setPluginSecrets } from "@/utils/pluginsApi";
import { extractApiErrorMessage } from "@/utils/toolsFormUtils";
import type { Plugin } from "@/types/plugins";

const FIELD_CLASS =
  "!h-10 !min-h-10 !max-h-10 w-full box-border !rounded-[10px] !border-2 border-gray-300 bg-white !pl-[12px] !pr-10 !py-0 !text-[13px] !font-semibold !leading-none text-deep-onyx dark:border-deep-onyx dark:bg-deep-onyx dark:text-pure-mist";

const SECRET_MASK = "********";

function nextSecretValue(previous: string, next: string): string {
  if (previous !== SECRET_MASK) return next;
  if (!next || next === SECRET_MASK) return "";
  if (next.startsWith(SECRET_MASK)) return next.slice(SECRET_MASK.length);
  if (SECRET_MASK.startsWith(next)) return "";
  return next;
}

interface PluginSecretsDialogProps {
  pluginId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function PluginSecretsDialog({
  pluginId,
  open,
  onOpenChange,
  onSuccess,
}: PluginSecretsDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  const reset = () => {
    setPlugin(null);
    setValues({});
    setVisible({});
  };

  const loadPlugin = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await getPlugin(id);
      if (response.success && response.plugin) {
        const loaded = response.plugin;
        const names = loaded.secret_names ?? [];
        setPlugin(loaded);
        setValues(
          Object.fromEntries(
            names.map((name) => [
              name,
              loaded.secrets_configured?.[name] ? SECRET_MASK : "",
            ]),
          ),
        );
        setVisible(Object.fromEntries(names.map((name) => [name, false])));
        return;
      }
      toast.error(response.message || "Failed to load plugin secrets.");
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(
        extractApiErrorMessage(error, "Failed to load plugin secrets."),
      );
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && pluginId) {
      loadPlugin(pluginId);
    }
    if (!open) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, pluginId]);

  const secretNames = plugin?.secret_names ?? [];

  const handleSubmit = async () => {
    if (!plugin) return;

    const secrets: Record<string, string> = {};
    for (const name of secretNames) {
      const value = (values[name] ?? "").trim();
      if (!value || value === SECRET_MASK) continue;
      secrets[name] = value;
    }

    if (Object.keys(secrets).length === 0) {
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await setPluginSecrets({
        plugin_id: plugin.plugin_id,
        secrets,
      });
      if (response.success) {
        toast.success("Plugin secrets saved.");
        onOpenChange(false);
        onSuccess?.();
        return;
      }
      toast.error(response.message || "Failed to save plugin secrets.");
    } catch (error: unknown) {
      toast.error(
        extractApiErrorMessage(error, "Failed to save plugin secrets."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Plugin secrets</DialogTitle>
          <DialogDescription>
            Values are never shown after save. Leave a field blank to keep the
            existing value.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <div className="grid gap-4 py-2">
            <p className="text-[13px] font-medium text-deep-onyx dark:text-pure-mist">
              {plugin?.display_name || plugin?.name}
            </p>
            {secretNames.length === 0 ? (
              <p className="text-[12px] text-gray-500 dark:text-gray-400">
                This plugin has no secrets to configure.
              </p>
            ) : (
              secretNames.map((name) => {
                const isVisible = visible[name] === true;
                return (
                  <div key={name} className="grid gap-1.5">
                    <p className="font-bold text-[13px] font-mono">{name}</p>
                    <div className="relative">
                      <CustomInput
                        type={isVisible ? "text" : "password"}
                        autoComplete="new-password"
                        value={values[name] ?? ""}
                        onChange={(event) =>
                          setValues((prev) => ({
                            ...prev,
                            [name]: nextSecretValue(
                              prev[name] ?? "",
                              event.target.value,
                            ),
                          }))
                        }
                        onFocus={(event) => {
                          if ((values[name] ?? "") === SECRET_MASK) {
                            event.target.select();
                          }
                        }}
                        placeholder="Enter value"
                        disabled={isSubmitting}
                        className={FIELD_CLASS}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setVisible((prev) => ({
                            ...prev,
                            [name]: !prev[name],
                          }))
                        }
                        disabled={isSubmitting}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-serene-purple transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={
                          isVisible ? `Hide ${name}` : `Show ${name}`
                        }
                      >
                        {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <PrimaryButton
              className="bg-transparent border border-gray-300 dark:border-white text-gray-700 dark:text-white text-[12px] hover:bg-white dark:hover:bg-pure-mist dark:hover:text-deep-onyx"
              disabled={isSubmitting}
            >
              Cancel
            </PrimaryButton>
          </DialogClose>
          <PrimaryButton
            className="min-w-[95px] text-[12px] font-semibold flex items-center gap-2"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading || secretNames.length === 0}
          >
            {isSubmitting ? (
              <Spinner className="border-white dark:border-deep-onyx" />
            ) : (
              "Save"
            )}
          </PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
