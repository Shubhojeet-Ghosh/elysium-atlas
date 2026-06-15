"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store";
import { setToolIds } from "@/store/reducers/agentSlice";
import { fetchTools } from "@/utils/toolsApi";
import InfoIcon from "@/components/ui/InfoIcon";
import Spinner from "@/components/ui/Spinner";
import { useAgentReadOnly } from "@/hooks/useCanManageAgents";
import type { Tool } from "@/types/tools";

const MAX_TOOLS = 50;

export default function AgentToolsSelector() {
  const dispatch = useAppDispatch();
  const readOnly = useAgentReadOnly();
  const selectedToolIds = useAppSelector((state) => state.agent.toolIds);

  const [open, setOpen] = useState(false);
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    async function loadTools() {
      setIsLoading(true);
      try {
        const response = await fetchTools(1, 100, false);
        if (mounted && response.success) {
          setTools(response.tools ?? []);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadTools();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTools = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return tools;
    return tools.filter((tool) => {
      const label = (tool.display_name || tool.name).toLowerCase();
      return label.includes(query) || tool.name.toLowerCase().includes(query);
    });
  }, [tools, searchQuery]);

  const selectedCount = selectedToolIds.length;

  const triggerLabel =
    selectedCount === 0
      ? "Select tools..."
      : `${selectedCount} tool${selectedCount === 1 ? "" : "s"} selected`;

  const toggleTool = (toolId: string) => {
    if (readOnly) return;

    const isSelected = selectedToolIds.includes(toolId);
    if (isSelected) {
      dispatch(setToolIds(selectedToolIds.filter((id) => id !== toolId)));
      return;
    }

    if (selectedToolIds.length >= MAX_TOOLS) return;
    dispatch(setToolIds([...selectedToolIds, toolId]));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <label className="text-[14px] font-[600] text-deep-onyx dark:text-pure-mist">
            LLM Tools
          </label>
          <InfoIcon text="Choose team tools this agent can call during conversations. Changes save with the agent update." />
        </div>
        <p className="text-[14px] font-[500] text-gray-500 dark:text-gray-400 mt-[2px]">
          Attach HTTP tools for the AI to use at runtime.
        </p>
      </div>

      <div ref={containerRef} className="relative w-full">
        <button
          type="button"
          disabled={readOnly || isLoading}
          onClick={() => {
            if (!readOnly && !isLoading) setOpen(!open);
          }}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-[13px] font-[500] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
            selectedCount === 0 && "text-muted-foreground",
          )}
        >
          <span className="truncate">
            {isLoading ? "Loading tools..." : triggerLabel}
          </span>
          {isLoading ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
          )}
        </button>

        {open && !readOnly && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md animate-in fade-in-0 zoom-in-95">
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex h-9 w-full rounded-md bg-transparent pl-9 pr-3 py-1 outline-none placeholder:text-muted-foreground border text-[13px] font-[500]"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-[280px] overflow-y-auto p-1">
              {isLoading ? (
                <div className="py-6 flex justify-center">
                  <Spinner />
                </div>
              ) : filteredTools.length === 0 ? (
                <div className="py-6 text-center text-[13px] text-muted-foreground">
                  {tools.length === 0
                    ? "No active tools for this team."
                    : "No tools match your search."}
                </div>
              ) : (
                filteredTools.map((tool) => {
                  const isSelected = selectedToolIds.includes(tool.tool_id);
                  const atLimit =
                    !isSelected && selectedToolIds.length >= MAX_TOOLS;

                  return (
                    <button
                      key={tool.tool_id}
                      type="button"
                      disabled={atLimit}
                      onClick={() => toggleTool(tool.tool_id)}
                      className={cn(
                        "relative flex w-full cursor-pointer select-none items-center justify-between rounded-sm px-2 py-2 outline-none transition-colors hover:bg-accent hover:text-accent-foreground text-left",
                        atLimit && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-[13px] font-[600] truncate">
                          {tool.display_name || tool.name}
                        </p>
                        {tool.display_name && (
                          <p className="text-[11px] text-muted-foreground font-mono truncate">
                            {tool.name}
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
        )}
      </div>

      {selectedCount >= MAX_TOOLS && (
        <p className="text-[11px] text-gray-500 dark:text-gray-400">
          Maximum of {MAX_TOOLS} tools per agent.
        </p>
      )}
    </div>
  );
}
