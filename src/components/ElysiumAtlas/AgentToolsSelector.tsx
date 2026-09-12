"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, Puzzle, Search, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  setPluginIds,
  setToolIds,
  updateToolCallingConfig,
} from "@/store/reducers/agentSlice";
import { fetchTools } from "@/utils/toolsApi";
import { fetchPlugins } from "@/utils/pluginsApi";
import CustomSelector from "@/components/ui/CustomSelector";
import CustomInput from "@/components/inputs/CustomInput";
import Spinner from "@/components/ui/Spinner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SHEET_CONTENT_CLASSNAME } from "@/lib/sheetConfig";
import { useAgentReadOnly } from "@/hooks/useCanManageAgents";
import type { Tool } from "@/types/tools";
import type { Plugin } from "@/types/plugins";

const MAX_TOOLS = 50;
const MAX_PLUGINS = 20;

const TIMING_INPUT_CLASS =
  "!h-9 !min-h-9 !max-h-9 !w-[72px] !max-w-[72px] shrink-0 box-border !rounded-[10px] !border-2 border-gray-300 bg-white !px-[10px] !py-0 !text-[14px] !font-semibold !leading-none text-center text-deep-onyx dark:border-deep-onyx dark:bg-deep-onyx dark:text-pure-mist [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

function parseNumericInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function SettingSwitch({
  checked,
  disabled,
  ariaLabel,
  onToggle,
}: {
  checked: boolean;
  disabled?: boolean;
  ariaLabel: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-serene-purple/50",
        checked ? "bg-serene-purple" : "bg-gray-300 dark:bg-gray-600",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

function SettingRow({
  title,
  description,
  control,
}: {
  title: string;
  description: string;
  control: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <label className="text-sm font-medium">{title}</label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {control}
    </div>
  );
}

function SettingField({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-medium">{title}</label>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="mt-[10px]">{children}</div>
    </div>
  );
}

export default function AgentToolsSelector() {
  const dispatch = useAppDispatch();
  const readOnly = useAgentReadOnly();
  const selectedToolIds = useAppSelector((state) => state.agent.toolIds);
  const selectedPluginIds = useAppSelector(
    (state) => state.agent.pluginIds ?? [],
  );
  const toolCallingConfig = useAppSelector(
    (state) => state.agent.toolCallingConfig,
  );

  const [open, setOpen] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toolSearchQuery, setToolSearchQuery] = useState("");
  const [pluginSearchQuery, setPluginSearchQuery] = useState("");
  const [maxRoundsInput, setMaxRoundsInput] = useState(
    String(toolCallingConfig.max_rounds),
  );
  const [maxExecutionsInput, setMaxExecutionsInput] = useState(
    String(toolCallingConfig.max_executions_per_turn),
  );

  useEffect(() => {
    setMaxRoundsInput(String(toolCallingConfig.max_rounds));
    setMaxExecutionsInput(String(toolCallingConfig.max_executions_per_turn));
  }, [toolCallingConfig.max_rounds, toolCallingConfig.max_executions_per_turn]);

  useEffect(() => {
    let mounted = true;

    async function loadAttachments() {
      setIsLoading(true);
      try {
        const [toolsResponse, pluginsResponse] = await Promise.all([
          fetchTools(1, 100, false),
          fetchPlugins(1, 100, false),
        ]);
        if (!mounted) return;
        if (toolsResponse.success) {
          setTools(toolsResponse.tools ?? []);
        }
        if (pluginsResponse.success) {
          setPlugins(pluginsResponse.plugins ?? []);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadAttachments();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredTools = useMemo(() => {
    const query = toolSearchQuery.trim().toLowerCase();
    if (!query) return tools;
    return tools.filter((tool) => {
      const label = (tool.display_name || tool.name).toLowerCase();
      return label.includes(query) || tool.name.toLowerCase().includes(query);
    });
  }, [tools, toolSearchQuery]);

  const filteredPlugins = useMemo(() => {
    const query = pluginSearchQuery.trim().toLowerCase();
    if (!query) return plugins;
    return plugins.filter((plugin) => {
      const label = (plugin.display_name || plugin.name).toLowerCase();
      return (
        label.includes(query) || plugin.name.toLowerCase().includes(query)
      );
    });
  }, [plugins, pluginSearchQuery]);

  const selectedToolNames = useMemo(
    () =>
      new Set(
        tools
          .filter((tool) => selectedToolIds.includes(tool.tool_id))
          .map((tool) => tool.name),
      ),
    [tools, selectedToolIds],
  );

  const selectedPluginNames = useMemo(
    () =>
      new Set(
        plugins
          .filter((plugin) => selectedPluginIds.includes(plugin.plugin_id))
          .map((plugin) => plugin.name),
      ),
    [plugins, selectedPluginIds],
  );

  const selectedToolCount = selectedToolIds.length;
  const selectedPluginCount = selectedPluginIds.length;
  const showCallingSettings = selectedToolCount > 0 || selectedPluginCount > 0;

  const selectorValue = useMemo(() => {
    if (isLoading) return "Loading...";
    if (selectedToolCount === 0 && selectedPluginCount === 0) return "";
    if (selectedToolCount === 1 && selectedPluginCount === 0) {
      const tool = tools.find((item) => item.tool_id === selectedToolIds[0]);
      return tool?.display_name || tool?.name || "1 tool selected";
    }
    if (selectedPluginCount === 1 && selectedToolCount === 0) {
      const plugin = plugins.find(
        (item) => item.plugin_id === selectedPluginIds[0],
      );
      return plugin?.display_name || plugin?.name || "1 plugin selected";
    }
    const parts: string[] = [];
    if (selectedToolCount > 0) {
      parts.push(
        `${selectedToolCount} ${selectedToolCount === 1 ? "tool" : "tools"}`,
      );
    }
    if (selectedPluginCount > 0) {
      parts.push(
        `${selectedPluginCount} ${selectedPluginCount === 1 ? "plugin" : "plugins"}`,
      );
    }
    return `${parts.join(", ")} selected`;
  }, [
    isLoading,
    selectedToolCount,
    selectedPluginCount,
    selectedToolIds,
    selectedPluginIds,
    tools,
    plugins,
  ]);

  const toggleTool = (tool: Tool) => {
    if (readOnly) return;

    const isSelected = selectedToolIds.includes(tool.tool_id);
    if (isSelected) {
      dispatch(setToolIds(selectedToolIds.filter((id) => id !== tool.tool_id)));
      return;
    }

    if (selectedToolIds.length >= MAX_TOOLS) return;
    if (selectedPluginNames.has(tool.name)) return;
    dispatch(setToolIds([...selectedToolIds, tool.tool_id]));
  };

  const togglePlugin = (plugin: Plugin) => {
    if (readOnly) return;

    const isSelected = selectedPluginIds.includes(plugin.plugin_id);
    if (isSelected) {
      dispatch(
        setPluginIds(
          selectedPluginIds.filter((id) => id !== plugin.plugin_id),
        ),
      );
      return;
    }

    if (selectedPluginIds.length >= MAX_PLUGINS) return;
    if (selectedToolNames.has(plugin.name)) return;
    dispatch(setPluginIds([...selectedPluginIds, plugin.plugin_id]));
  };

  const clampNumber = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

  const handleMaxRoundsChange = (value: string) => {
    if (value !== "" && !/^\d+$/.test(value)) return;

    setMaxRoundsInput(value);

    const parsed = parseNumericInput(value);
    if (parsed === null) return;

    dispatch(
      updateToolCallingConfig({
        max_rounds: clampNumber(parsed, 1, 10),
      }),
    );
  };

  const handleMaxExecutionsChange = (value: string) => {
    if (value !== "" && !/^\d+$/.test(value)) return;

    setMaxExecutionsInput(value);

    const parsed = parseNumericInput(value);
    if (parsed === null) return;

    dispatch(
      updateToolCallingConfig({
        max_executions_per_turn: clampNumber(parsed, 1, 20),
      }),
    );
  };

  const handleMaxRoundsBlur = () => {
    const parsed = parseNumericInput(maxRoundsInput);
    const clamped = clampNumber(
      parsed ?? toolCallingConfig.max_rounds,
      1,
      10,
    );
    setMaxRoundsInput(String(clamped));
    dispatch(
      updateToolCallingConfig({
        max_rounds: clamped,
      }),
    );
  };

  const handleMaxExecutionsBlur = () => {
    const parsed = parseNumericInput(maxExecutionsInput);
    const clamped = clampNumber(
      parsed ?? toolCallingConfig.max_executions_per_turn,
      1,
      20,
    );
    setMaxExecutionsInput(String(clamped));
    dispatch(
      updateToolCallingConfig({
        max_executions_per_turn: clamped,
      }),
    );
  };

  return (
    <>
      <div className="w-full">
        <div className="flex flex-col gap-2">
          <div>
            <label className="text-[14px] font-[600] text-deep-onyx dark:text-pure-mist">
              LLM Tools & Plugins
            </label>
            <p className="text-[14px] font-[500] text-gray-500 dark:text-gray-400 mt-[2px]">
              Attach HTTP tools and Python plugins for the AI to use at
              runtime.
            </p>
          </div>

          <CustomSelector
            label="LLM Tools & Plugins"
            value={selectorValue}
            className={`px-[10px] py-[12px] ${readOnly || isLoading ? "pointer-events-none opacity-60" : ""}`}
            onClick={() => {
              if (!readOnly && !isLoading) setOpen(true);
            }}
          />
        </div>
      </div>

      <Sheet
        open={open}
        onOpenChange={(nextOpen) => {
          if (!readOnly) setOpen(nextOpen);
        }}
      >
        <SheetContent
          className={cn(SHEET_CONTENT_CLASSNAME, "overflow-hidden")}
        >
          <SheetHeader className="shrink-0">
            <SheetTitle>
              <div className="flex items-center justify-start">
                <Wrench className="inline mr-2" size={18} />
                <p>LLM Tools & Plugins</p>
              </div>
            </SheetTitle>
            <SheetDescription>
              Attach HTTP tools and Python plugins for the AI to use at
              runtime.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 min-h-0 overflow-y-auto pb-6">
            <div className="mt-4 px-4">
              <label className="text-sm font-medium">Tools</label>
              <p className="text-xs text-muted-foreground">
                Choose team tools this agent can call during conversations.
              </p>

              <div className="mt-[10px] rounded-[10px] border-2 border-gray-300 dark:border-deep-onyx overflow-hidden bg-white dark:bg-deep-onyx">
                <div className="p-2 border-b border-gray-300 dark:border-deep-onyx">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <CustomInput
                      type="text"
                      placeholder="Search tools..."
                      value={toolSearchQuery}
                      onChange={(e) => setToolSearchQuery(e.target.value)}
                      disabled={readOnly}
                      className="pl-9 px-[10px] py-[10px] !text-[13px] !font-[500]"
                    />
                  </div>
                </div>

                <div className="max-h-[240px] overflow-y-auto p-1">
                  {isLoading ? (
                    <div className="py-6 flex justify-center">
                      <Spinner />
                    </div>
                  ) : filteredTools.length === 0 ? (
                    <div className="py-6 text-center text-[13px] font-[500] text-muted-foreground">
                      {tools.length === 0
                        ? "No active tools for this team."
                        : "No tools match your search."}
                    </div>
                  ) : (
                    filteredTools.map((tool) => {
                      const isSelected = selectedToolIds.includes(tool.tool_id);
                      const atLimit =
                        !isSelected && selectedToolIds.length >= MAX_TOOLS;
                      const nameClash =
                        !isSelected && selectedPluginNames.has(tool.name);
                      const disabled = readOnly || atLimit || nameClash;

                      return (
                        <button
                          key={tool.tool_id}
                          type="button"
                          disabled={disabled}
                          onClick={() => toggleTool(tool)}
                          className={cn(
                            "relative flex w-full cursor-pointer select-none items-center justify-between rounded-sm px-2 py-1.5 outline-none transition-colors hover:bg-accent hover:text-accent-foreground text-left text-[13px] font-[500]",
                            disabled && "opacity-50 cursor-not-allowed",
                          )}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="truncate">
                              {tool.display_name || tool.name}
                            </p>
                            {tool.display_name && (
                              <p className="text-[11px] text-muted-foreground font-mono truncate">
                                {tool.name}
                              </p>
                            )}
                            {nameClash && (
                              <p className="text-[11px] text-muted-foreground">
                                Name clashes with an attached plugin
                              </p>
                            )}
                          </div>
                          <Check
                            className={cn(
                              "h-4 w-4 shrink-0",
                              isSelected ? "opacity-100" : "opacity-0",
                            )}
                          />
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {selectedToolCount >= MAX_TOOLS && (
                <p className="text-xs text-muted-foreground mt-2">
                  Maximum of {MAX_TOOLS} tools per agent.
                </p>
              )}
            </div>

            <div className="mt-6 px-4">
              <label className="text-sm font-medium inline-flex items-center gap-1.5">
                <Puzzle size={14} />
                Plugins
              </label>
              <p className="text-xs text-muted-foreground">
                Choose team plugins this agent can call during conversations.
                Max {MAX_PLUGINS}.
              </p>

              <div className="mt-[10px] rounded-[10px] border-2 border-gray-300 dark:border-deep-onyx overflow-hidden bg-white dark:bg-deep-onyx">
                <div className="p-2 border-b border-gray-300 dark:border-deep-onyx">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <CustomInput
                      type="text"
                      placeholder="Search plugins..."
                      value={pluginSearchQuery}
                      onChange={(e) => setPluginSearchQuery(e.target.value)}
                      disabled={readOnly}
                      className="pl-9 px-[10px] py-[10px] !text-[13px] !font-[500]"
                    />
                  </div>
                </div>

                <div className="max-h-[240px] overflow-y-auto p-1">
                  {isLoading ? (
                    <div className="py-6 flex justify-center">
                      <Spinner />
                    </div>
                  ) : filteredPlugins.length === 0 ? (
                    <div className="py-6 text-center text-[13px] font-[500] text-muted-foreground">
                      {plugins.length === 0
                        ? "No active plugins for this team."
                        : "No plugins match your search."}
                    </div>
                  ) : (
                    filteredPlugins.map((plugin) => {
                      const isSelected = selectedPluginIds.includes(
                        plugin.plugin_id,
                      );
                      const atLimit =
                        !isSelected &&
                        selectedPluginIds.length >= MAX_PLUGINS;
                      const nameClash =
                        !isSelected && selectedToolNames.has(plugin.name);
                      const disabled = readOnly || atLimit || nameClash;

                      return (
                        <button
                          key={plugin.plugin_id}
                          type="button"
                          disabled={disabled}
                          onClick={() => togglePlugin(plugin)}
                          className={cn(
                            "relative flex w-full cursor-pointer select-none items-center justify-between rounded-sm px-2 py-1.5 outline-none transition-colors hover:bg-accent hover:text-accent-foreground text-left text-[13px] font-[500]",
                            disabled && "opacity-50 cursor-not-allowed",
                          )}
                        >
                          <div className="min-w-0 pr-2">
                            <p className="truncate">
                              {plugin.display_name || plugin.name}
                            </p>
                            {plugin.display_name && (
                              <p className="text-[11px] text-muted-foreground font-mono truncate">
                                {plugin.name}
                              </p>
                            )}
                            {nameClash && (
                              <p className="text-[11px] text-muted-foreground">
                                Name clashes with an attached tool
                              </p>
                            )}
                          </div>
                          <Check
                            className={cn(
                              "h-4 w-4 shrink-0",
                              isSelected ? "opacity-100" : "opacity-0",
                            )}
                          />
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {selectedPluginCount >= MAX_PLUGINS && (
                <p className="text-xs text-muted-foreground mt-2">
                  Maximum of {MAX_PLUGINS} plugins per agent.
                </p>
              )}
            </div>

            {showCallingSettings && (
              <div className="mt-4 px-4 space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    Tool calling settings
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Control how attached tools and plugins run during visitor
                    chat.
                  </p>
                </div>

                <SettingRow
                  title="Enable tool calling"
                  description="When off, tools and plugins stay attached but are not executed at chat time."
                  control={
                    <SettingSwitch
                      checked={toolCallingConfig.enabled}
                      disabled={readOnly}
                      ariaLabel={
                        toolCallingConfig.enabled
                          ? "Turn off tool calling"
                          : "Turn on tool calling"
                      }
                      onToggle={() =>
                        dispatch(
                          updateToolCallingConfig({
                            enabled: !toolCallingConfig.enabled,
                          }),
                        )
                      }
                    />
                  }
                />

                <SettingField
                  title="Max rounds"
                  description="How many think → call tools → replan cycles are allowed per visitor message."
                >
                  <CustomInput
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={maxRoundsInput}
                    disabled={readOnly}
                    onChange={(e) => handleMaxRoundsChange(e.target.value)}
                    onBlur={handleMaxRoundsBlur}
                    className={TIMING_INPUT_CLASS}
                    aria-label="Max rounds"
                  />
                </SettingField>

                <SettingField
                  title="Max executions per turn"
                  description="Total tool and plugin calls allowed in one visitor message."
                >
                  <CustomInput
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={maxExecutionsInput}
                    disabled={readOnly}
                    onChange={(e) => handleMaxExecutionsChange(e.target.value)}
                    onBlur={handleMaxExecutionsBlur}
                    className={TIMING_INPUT_CLASS}
                    aria-label="Max executions per turn"
                  />
                </SettingField>

                <SettingRow
                  title="Parallel calls per round"
                  description="Allow independent tools and plugins to run together in the same step. Turn off if APIs are rate-limited or must run one at a time."
                  control={
                    <SettingSwitch
                      checked={toolCallingConfig.parallel_calls_per_round}
                      disabled={readOnly}
                      ariaLabel={
                        toolCallingConfig.parallel_calls_per_round
                          ? "Turn off parallel calls per round"
                          : "Turn on parallel calls per round"
                      }
                      onToggle={() =>
                        dispatch(
                          updateToolCallingConfig({
                            parallel_calls_per_round:
                              !toolCallingConfig.parallel_calls_per_round,
                          }),
                        )
                      }
                    />
                  }
                />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
