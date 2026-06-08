"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { EmailFlowNodeType } from "@/utils/emailFlowsApi";
import type { EmailFlowNodeData } from "@/utils/flowDocToReactFlow";

type EmailFlowNode = Node<EmailFlowNodeData, EmailFlowNodeType>;

const typeAccent: Record<EmailFlowNodeType, string> = {
  start: "border-teal-green/30 bg-teal-green/5",
  load_thread_context: "border-blue-300/40 bg-blue-50",
  read_kb: "border-emerald-300/40 bg-emerald-50",
  read_tools: "border-indigo-300/40 bg-indigo-50",
  ai_department_router: "border-violet-300/40 bg-violet-50",
  ai_recipients_generator: "border-cyan-300/40 bg-cyan-50",
  generate_email: "border-serene-purple/30 bg-serene-purple/5",
  call_external_tool: "border-slate-400/40 bg-slate-50",
  save_gmail_draft: "border-amber-400/40 bg-amber-50",
  send_email: "border-orange-300/40 bg-orange-50",
  stop: "border-gray-300 bg-gray-50",
};

function getExternalToolPreview(data: EmailFlowNodeData) {
  const bindingTools = data.binding?.tools;
  if (Array.isArray(bindingTools) && bindingTools.length > 0) {
    return bindingTools
      .map((tool) => {
        if (!tool || typeof tool !== "object") {
          return null;
        }
        const entry = tool as { display_name?: string; name?: string };
        return entry.display_name || entry.name || null;
      })
      .filter((name): name is string => Boolean(name));
  }

  const configuredToolIds = Array.isArray(data.config?.external_tools)
    ? data.config.external_tools
    : Array.isArray(data.config?.tool_ids)
      ? data.config.tool_ids
      : [];
  if (configuredToolIds.length > 0) {
    return [
      `${configuredToolIds.length} tool${configuredToolIds.length === 1 ? "" : "s"}`,
    ];
  }

  return [];
}

export default function EmailFlowNode({
  data,
  type,
  selected,
}: NodeProps<EmailFlowNode>) {
  const nodeType = type ?? data.nodeType;
  const showTarget = nodeType !== "start";
  const showSource = nodeType !== "stop";
  const externalToolPreview =
    nodeType === "call_external_tool" ? getExternalToolPreview(data) : [];

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-1 rounded-[12px] border-2 px-3 py-3 shadow-sm transition-shadow ${typeAccent[nodeType]} ${
        selected ? "ring-2 ring-serene-purple/30 shadow-md" : ""
      }`}
    >
      {showTarget ? (
        <Handle
          id="left"
          type="target"
          position={Position.Left}
          className="!h-2.5 !w-2.5 !border-2 !border-white !bg-serene-purple"
        />
      ) : null}

      <p className="text-center text-[13px] font-[600] text-deep-onyx leading-snug">
        {data.label}
      </p>

      {nodeType === "call_external_tool" ? (
        <div className="flex max-w-full flex-wrap items-center justify-center gap-1 px-1">
          {externalToolPreview.length > 0 ? (
            externalToolPreview.slice(0, 2).map((name) => (
              <span
                key={name}
                className="max-w-[110px] truncate rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-[500] text-gray-600"
              >
                {name}
              </span>
            ))
          ) : (
            <span className="text-[10px] text-gray-500">No tools selected</span>
          )}
          {externalToolPreview.length > 2 ? (
            <span className="text-[10px] text-gray-500">
              +{externalToolPreview.length - 2}
            </span>
          ) : null}
        </div>
      ) : null}

      {showSource ? (
        <Handle
          id="right"
          type="source"
          position={Position.Right}
          className="!h-2.5 !w-2.5 !border-2 !border-white !bg-serene-purple"
        />
      ) : null}
    </div>
  );
}
