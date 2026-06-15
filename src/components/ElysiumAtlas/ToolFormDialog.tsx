"use client";

import { useEffect, useState } from "react";
import { Plus, Wrench } from "lucide-react";
import { toast } from "sonner";
import CustomInput from "@/components/inputs/CustomInput";
import CustomTextareaPrimary from "@/components/inputs/CustomTextareaPrimary";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTool, getTool, updateTool } from "@/utils/toolsApi";
import ToolParameterFields from "@/components/ElysiumAtlas/ToolParameterFields";
import {
  createEmptyParameterRow,
  extractApiErrorMessage,
  rowsToToolParameters,
  toolParametersToRows,
  validateDisplayName,
  validateParameterRows,
  validateToolName,
} from "@/utils/toolsFormUtils";
import type {
  AuthLocation,
  AuthType,
  HttpMethod,
  Tool,
  ToolParameterRow,
  TokenPrefix,
} from "@/types/tools";

const FIELD_CLASS =
  "!h-10 !min-h-10 !max-h-10 w-full box-border !rounded-[10px] !border-2 border-gray-300 bg-white !px-[12px] !py-0 !text-[13px] !font-semibold !leading-none text-deep-onyx dark:border-deep-onyx dark:bg-deep-onyx dark:text-pure-mist";

const HTTP_METHODS: HttpMethod[] = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
];

interface ToolFormDialogProps {
  mode: "create" | "edit";
  toolId?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function ToolFormDialog({
  mode,
  toolId,
  trigger,
  open: controlledOpen,
  onOpenChange,
  onSuccess,
}: ToolFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [isLoadingTool, setIsLoadingTool] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [httpMethod, setHttpMethod] = useState<HttpMethod>("GET");
  const [authType, setAuthType] = useState<AuthType>("none");
  const [authLocation, setAuthLocation] = useState<AuthLocation>("header");
  const [authParamName, setAuthParamName] = useState("Authorization");
  const [authToken, setAuthToken] = useState("");
  const [authTokenPrefix, setAuthTokenPrefix] = useState<TokenPrefix>("Bearer");
  const [tokenConfigured, setTokenConfigured] = useState(false);
  const [parameters, setParameters] = useState<ToolParameterRow[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [authClearConfirmOpen, setAuthClearConfirmOpen] = useState(false);

  const resetForm = () => {
    setDisplayName("");
    setName("");
    setDescription("");
    setApiUrl("");
    setHttpMethod("GET");
    setAuthType("none");
    setAuthLocation("header");
    setAuthParamName("Authorization");
    setAuthToken("");
    setAuthTokenPrefix("Bearer");
    setTokenConfigured(false);
    setParameters([]);
    setIsActive(true);
    setInlineError(null);
    setAuthClearConfirmOpen(false);
  };

  const populateFromTool = (tool: Tool) => {
    setDisplayName(tool.display_name ?? "");
    setName(tool.name);
    setDescription(tool.description);
    setApiUrl(tool.api_url);
    setHttpMethod(tool.http_method);
    setAuthType(tool.auth.type);
    setAuthLocation(tool.auth.location ?? "header");
    setAuthParamName(tool.auth.param_name ?? "Authorization");
    setAuthToken("");
    setAuthTokenPrefix(tool.auth.token_prefix ?? "Bearer");
    setTokenConfigured(tool.auth.token_configured ?? false);
    setParameters(toolParametersToRows(tool.parameters));
    setIsActive(tool.is_active);
  };

  const loadTool = async (id: string) => {
    setIsLoadingTool(true);
    try {
      const response = await getTool(id);
      if (response.success && response.tool) {
        populateFromTool(response.tool);
        return;
      }
      toast.error(response.message || "Failed to load tool.");
      setOpen(false);
    } catch (error: unknown) {
      toast.error(extractApiErrorMessage(error, "Failed to load tool."));
      setOpen(false);
    } finally {
      setIsLoadingTool(false);
    }
  };

  useEffect(() => {
    if (open && mode === "edit" && toolId) {
      loadTool(toolId);
    }
    if (!open) {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, toolId]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) resetForm();
  };

  const handleAuthTypeChange = (value: AuthType) => {
    if (
      value === "none" &&
      authType === "api_key" &&
      tokenConfigured &&
      mode === "edit"
    ) {
      setAuthClearConfirmOpen(true);
      return;
    }
    setAuthType(value);
  };

  const confirmClearAuth = () => {
    setAuthType("none");
    setAuthClearConfirmOpen(false);
  };

  const addParameter = () => {
    setParameters((prev) => [...prev, createEmptyParameterRow()]);
  };

  const removeParameter = (id: string) => {
    setParameters((prev) => prev.filter((row) => row.id !== id));
  };

  const validateForm = (): string | null => {
    const displayNameError = validateDisplayName(displayName);
    if (displayNameError) return displayNameError;
    const nameError = validateToolName(name);
    if (nameError) return nameError;
    if (!description.trim()) return "Description is required.";
    if (description.trim().length > 2048) {
      return "Description must be 2048 characters or fewer.";
    }
    if (!apiUrl.trim()) return "API URL is required.";
    if (!/^https?:\/\//i.test(apiUrl.trim())) {
      return "API URL must start with http:// or https://";
    }
    if (authType === "api_key") {
      if (!authParamName.trim()) return "Parameter name is required for API key auth.";
      if (mode === "create" && !authToken.trim()) {
        return "API key token is required.";
      }
      if (mode === "edit" && !tokenConfigured && !authToken.trim()) {
        return "API key token is required.";
      }
      if (authLocation === "query" && authTokenPrefix !== "none") {
        return 'Token prefix must be "none" for query auth.';
      }
    }

    const paramError = validateParameterRows(parameters);
    if (paramError) return paramError;

    return null;
  };

  const buildAuthPayload = () => {
    if (authType === "none") return { type: "none" as const };
    const auth: {
      type: "api_key";
      location: AuthLocation;
      param_name: string;
      token_prefix: TokenPrefix;
      token?: string;
    } = {
      type: "api_key",
      location: authLocation,
      param_name: authParamName.trim(),
      token_prefix: authLocation === "query" ? "none" : authTokenPrefix,
    };
    if (authToken.trim()) auth.token = authToken.trim();
    return auth;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setInlineError(validationError);
      return;
    }
    setInlineError(null);
    setIsSubmitting(true);

    const paramPayload = rowsToToolParameters(parameters);

    try {
      if (mode === "create") {
        const response = await createTool({
          name: name.trim(),
          display_name: displayName.trim(),
          description: description.trim(),
          api_url: apiUrl.trim(),
          http_method: httpMethod,
          auth: buildAuthPayload(),
          parameters: paramPayload,
        });

        if (response.success) {
          toast.success("Tool created successfully.");
          setOpen(false);
          onSuccess?.();
          return;
        }
        toast.error(response.message || "Failed to create tool.");
      } else if (toolId) {
        const response = await updateTool({
          tool_id: toolId,
          name: name.trim(),
          display_name: displayName.trim(),
          description: description.trim(),
          api_url: apiUrl.trim(),
          http_method: httpMethod,
          auth: buildAuthPayload(),
          parameters: paramPayload,
          is_active: isActive,
        });

        if (response.success) {
          toast.success("Tool updated successfully.");
          setOpen(false);
          onSuccess?.();
          return;
        }
        toast.error(response.message || "Failed to update tool.");
      }
    } catch (error: unknown) {
      toast.error(
        extractApiErrorMessage(
          error,
          mode === "create" ? "Failed to create tool." : "Failed to update tool.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const dialogContent = (
    <DialogContent
      className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto"
      onPointerDownOutside={(event) => {
        const target = event.target;
        if (
          target instanceof Element &&
          target.closest('[data-slot="select-content"]')
        ) {
          event.preventDefault();
        }
      }}
    >
      <DialogHeader>
        <DialogTitle>{mode === "create" ? "Add tool" : "Edit tool"}</DialogTitle>
        <DialogDescription>
          {mode === "create"
            ? "Configure an external HTTP integration for your team. The AI uses the function name and description to decide when to call it."
            : "Update this tool's configuration. Leave the API key blank to keep the existing token."}
        </DialogDescription>
      </DialogHeader>

      {isLoadingTool ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div className="grid gap-4 py-2">
          {inlineError && (
            <p className="text-[12px] text-danger-red font-medium">{inlineError}</p>
          )}

          <section className="grid gap-3">
            <p className="text-[13px] font-bold text-deep-onyx dark:text-pure-mist">
              Basic info
            </p>
            <div className="grid gap-1.5">
              <p className="font-bold text-[13px]">Display name</p>
              <CustomInput
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Get Order Status"
                disabled={isSubmitting}
                className={FIELD_CLASS}
              />
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Human-readable label shown in the dashboard.
              </p>
            </div>
            <div className="grid gap-1.5">
              <p className="font-bold text-[13px]">Function name</p>
              <CustomInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="get_order_status"
                disabled={isSubmitting}
                className={FIELD_CLASS}
              />
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Lowercase snake_case identifier the LLM will call.
              </p>
            </div>
            <div className="grid gap-1.5">
              <p className="font-bold text-[13px]">
                When should the AI call this tool?
              </p>
              <CustomTextareaPrimary
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Use when the user asks about order status or tracking."
                rows={3}
                disabled={isSubmitting}
                className="!text-[13px]"
              />
            </div>
          </section>

          <section className="grid gap-3">
            <p className="text-[13px] font-bold text-deep-onyx dark:text-pure-mist">
              API
            </p>
            <div className="grid gap-1.5">
              <p className="font-bold text-[13px]">API URL</p>
              <CustomInput
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://api.example.com/orders"
                disabled={isSubmitting}
                className={FIELD_CLASS}
              />
            </div>
            <div className="grid gap-1.5">
              <p className="font-bold text-[13px]">HTTP method</p>
              <Select
                value={httpMethod}
                onValueChange={(value) => setHttpMethod(value as HttpMethod)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="h-12 min-h-12 w-full cursor-pointer border-[2px] border-gray-300 dark:border-deep-onyx rounded-[10px] bg-white dark:bg-deep-onyx text-[13px] font-[600] text-deep-onyx dark:text-pure-mist shadow-none focus-visible:border-serene-purple focus-visible:ring-serene-purple/30 px-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[1100]">
                  {HTTP_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          <section className="grid gap-3">
            <p className="text-[13px] font-bold text-deep-onyx dark:text-pure-mist">
              Authorization
            </p>
            <Select
              value={authType}
              onValueChange={(value) => handleAuthTypeChange(value as AuthType)}
              disabled={isSubmitting}
            >
              <SelectTrigger className="h-12 min-h-12 w-full cursor-pointer border-[2px] border-gray-300 dark:border-deep-onyx rounded-[10px] bg-white dark:bg-deep-onyx text-[13px] font-[600] text-deep-onyx dark:text-pure-mist shadow-none focus-visible:border-serene-purple focus-visible:ring-serene-purple/30 px-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[1100]">
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="api_key">API key</SelectItem>
              </SelectContent>
            </Select>

            {authType === "api_key" && (
              <div className="grid gap-3 rounded-[10px] border border-gray-200 dark:border-deep-onyx p-3">
                <div className="grid gap-1.5">
                  <p className="font-bold text-[13px]">Location</p>
                  <Select
                    value={authLocation}
                    onValueChange={(value) => {
                      const loc = value as AuthLocation;
                      setAuthLocation(loc);
                      if (loc === "query") setAuthTokenPrefix("none");
                    }}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="h-12 min-h-12 w-full cursor-pointer border-[2px] border-gray-300 dark:border-deep-onyx rounded-[10px] bg-white dark:bg-deep-onyx text-[13px] font-[600] text-deep-onyx dark:text-pure-mist shadow-none focus-visible:border-serene-purple focus-visible:ring-serene-purple/30 px-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[1100]">
                      <SelectItem value="header">Header</SelectItem>
                      <SelectItem value="query">Query</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <p className="font-bold text-[13px]">Parameter name</p>
                  <CustomInput
                    value={authParamName}
                    onChange={(e) => setAuthParamName(e.target.value)}
                    placeholder={
                      authLocation === "header" ? "Authorization" : "api_key"
                    }
                    disabled={isSubmitting}
                    className={FIELD_CLASS}
                  />
                </div>
                {authLocation === "header" && (
                  <div className="grid gap-1.5">
                    <p className="font-bold text-[13px]">Token prefix</p>
                    <Select
                      value={authTokenPrefix}
                      onValueChange={(value) =>
                        setAuthTokenPrefix(value as TokenPrefix)
                      }
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="h-12 min-h-12 w-full cursor-pointer border-[2px] border-gray-300 dark:border-deep-onyx rounded-[10px] bg-white dark:bg-deep-onyx text-[13px] font-[600] text-deep-onyx dark:text-pure-mist shadow-none focus-visible:border-serene-purple focus-visible:ring-serene-purple/30 px-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-[1100]">
                        <SelectItem value="Bearer">Bearer</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid gap-1.5">
                  <p className="font-bold text-[13px]">API key</p>
                  <CustomInput
                    type="password"
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    placeholder="Enter API key"
                    disabled={isSubmitting}
                    className={FIELD_CLASS}
                  />
                  {mode === "edit" && tokenConfigured && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Leave blank to keep the existing key.
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="grid gap-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-bold text-deep-onyx dark:text-pure-mist">
                Parameters
              </p>
              <button
                type="button"
                onClick={addParameter}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-serene-purple hover:text-serene-purple/80 cursor-pointer disabled:opacity-50"
              >
                <Plus size={14} />
                Add parameter
              </button>
            </div>

            {parameters.length === 0 ? (
              <p className="text-[12px] text-gray-500 dark:text-gray-400">
                No parameters. Add rows if the API expects inputs from the AI.
              </p>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-deep-onyx">
                {parameters.map((row) => (
                  <ToolParameterFields
                    key={row.id}
                    row={row}
                    onChange={(updated) =>
                      setParameters((prev) =>
                        prev.map((item) => (item.id === row.id ? updated : item)),
                      )
                    }
                    onRemove={() => removeParameter(row.id)}
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            )}
          </section>

          {mode === "edit" && (
            <label className="flex items-center justify-end gap-2 text-[13px] font-medium text-deep-onyx dark:text-pure-mist cursor-pointer">
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
          disabled={isSubmitting || isLoadingTool}
        >
          {isSubmitting ? (
            <Spinner className="border-white dark:border-deep-onyx" />
          ) : mode === "create" ? (
            "Create"
          ) : (
            "Update"
          )}
        </PrimaryButton>
      </DialogFooter>
    </DialogContent>
  );

  const authClearConfirmDialog = (
    <Dialog open={authClearConfirmOpen} onOpenChange={setAuthClearConfirmOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Remove API key?</DialogTitle>
          <DialogDescription>
            Switching to no auth will remove the stored API key for this tool.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <PrimaryButton
            className="bg-transparent border border-gray-300 dark:border-white text-gray-700 dark:text-white text-[12px] hover:bg-white dark:hover:bg-pure-mist dark:hover:text-deep-onyx"
            onClick={() => setAuthClearConfirmOpen(false)}
          >
            Cancel
          </PrimaryButton>
          <PrimaryButton
            className="min-w-[95px] text-[12px] font-semibold bg-danger-red hover:bg-danger-red/90"
            onClick={confirmClearAuth}
          >
            Remove key
          </PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (mode === "create") {
    return (
      <>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            {trigger ?? (
              <PrimaryButton className="text-[12px] font-semibold flex items-center gap-2">
                <Wrench size={14} />
                Add tool
              </PrimaryButton>
            )}
          </DialogTrigger>
          {dialogContent}
        </Dialog>
        {authClearConfirmDialog}
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {dialogContent}
      </Dialog>
      {authClearConfirmDialog}
    </>
  );
}
