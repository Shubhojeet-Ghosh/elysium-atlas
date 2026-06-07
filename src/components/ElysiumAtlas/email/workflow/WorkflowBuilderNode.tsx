"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import {
  WORKFLOW_NODE_TYPE,
  type WorkflowNodeData,
} from "./workflowBuilderConfig";

type WorkflowNode = Node<WorkflowNodeData, typeof WORKFLOW_NODE_TYPE>;

const kindAccent: Record<WorkflowNodeData["kind"], string> = {
  trigger: "border-teal-green/30 bg-teal-green/5",
  agent: "border-serene-purple/30 bg-serene-purple/5",
  knowledge: "border-emerald-300/40 bg-emerald-50",
  tool: "border-indigo-300/40 bg-indigo-50",
  classify: "border-violet-300/40 bg-violet-50",
  condition: "border-amber-400/40 bg-amber-50",
  assign: "border-cyan-300/40 bg-cyan-50",
  review: "border-orange-300/40 bg-orange-50",
  action: "border-blue-300/40 bg-blue-50",
  notify: "border-pink-300/40 bg-pink-50",
  webhook: "border-slate-400/40 bg-slate-50",
  delay: "border-gray-400/40 bg-gray-50",
  end: "border-gray-300 bg-gray-50",
};

export default function WorkflowBuilderNode({
  data,
  selected,
}: NodeProps<WorkflowNode>) {
  const showTarget = data.kind !== "trigger";
  const showSource = data.kind !== "end";

  return (
    <div
      className={`min-w-[200px] max-w-[240px] rounded-[12px] border-2 bg-white px-4 py-3 shadow-sm transition-shadow duration-200 ${
        selected
          ? "border-serene-purple shadow-md ring-2 ring-serene-purple/20"
          : `border-gray-200 ${kindAccent[data.kind]}`
      }`}
    >
      {showTarget ? (
        <Handle
          type="target"
          position={Position.Top}
          className="!h-2.5 !w-2.5 !border-2 !border-white !bg-serene-purple"
        />
      ) : null}

      <p className="text-[13px] font-[600] text-deep-onyx leading-snug">
        {data.label}
      </p>
      <p className="mt-1 text-[11px] font-[500] text-gray-500 leading-snug">
        {data.description}
      </p>

      {showSource ? (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!h-2.5 !w-2.5 !border-2 !border-white !bg-serene-purple"
        />
      ) : null}
    </div>
  );
}
