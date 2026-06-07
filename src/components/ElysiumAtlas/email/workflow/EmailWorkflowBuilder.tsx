"use client";

import { useCallback, useRef, useState } from "react";
import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft, Plus } from "lucide-react";
import CustomInput from "@/components/inputs/CustomInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import WorkflowBuilderNode from "./WorkflowBuilderNode";
import {
  WORKFLOW_NODE_TYPE,
  initialWorkflowNodes,
  workflowPaletteItems,
  type WorkflowNodeData,
} from "./workflowBuilderConfig";

const nodeTypes = {
  [WORKFLOW_NODE_TYPE]: WorkflowBuilderNode,
} satisfies NodeTypes;

const defaultEdgeOptions = {
  style: { stroke: "#6c5f8d", strokeWidth: 2 },
  animated: true,
};

const workflowDefaultViewport = {
  x: 48,
  y: 24,
  zoom: 0.8,
};

interface EmailWorkflowBuilderProps {
  onClose: () => void;
}

function EmailWorkflowBuilderCanvas({ onClose }: EmailWorkflowBuilderProps) {
  const reactFlowWrapperRef = useRef<HTMLDivElement>(null);
  const nodeIdRef = useRef(initialWorkflowNodes.length + 1);
  const { screenToFlowPosition } = useReactFlow();
  const [workflowName, setWorkflowName] = useState("Untitled workflow");
  const [nodes, setNodes, onNodesChange] = useNodesState<
    Node<WorkflowNodeData>
  >(initialWorkflowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((currentEdges) => addEdge(connection, currentEdges));
    },
    [setEdges],
  );

  const createNodeId = useCallback(() => {
    const id = `node-${nodeIdRef.current}`;
    nodeIdRef.current += 1;
    return id;
  }, []);

  const addPaletteNode = useCallback(
    (kind: WorkflowNodeData["kind"], label: string, description: string) => {
      const offset = (nodes.length % 5) * 24;

      setNodes((currentNodes) => [
        ...currentNodes,
        {
          id: createNodeId(),
          type: WORKFLOW_NODE_TYPE,
          position: {
            x: 260 + offset,
            y: 180 + offset,
          },
          data: { label, description, kind },
        },
      ]);
    },
    [createNodeId, nodes.length, setNodes],
  );

  const onDragStart = (
    event: React.DragEvent<HTMLButtonElement>,
    kind: WorkflowNodeData["kind"],
    label: string,
    description: string,
  ) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({ kind, label, description }),
    );
    event.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const raw = event.dataTransfer.getData("application/reactflow");
      if (!raw) {
        return;
      }

      let payload: {
        kind: WorkflowNodeData["kind"];
        label: string;
        description: string;
      };

      try {
        payload = JSON.parse(raw);
      } catch {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      setNodes((currentNodes) => [
        ...currentNodes,
        {
          id: createNodeId(),
          type: WORKFLOW_NODE_TYPE,
          position,
          data: {
            kind: payload.kind,
            label: payload.label,
            description: payload.description,
          },
        },
      ]);
    },
    [createNodeId, screenToFlowPosition, setNodes],
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[12px] border border-gray-200 bg-white">
      <header className="flex shrink-0 items-center justify-between gap-4 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to workflows"
            className="flex h-9 w-9 shrink-0 items-center justify-center text-gray-600 transition-colors duration-200 hover:text-serene-purple cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1 max-w-[420px]">
            <CustomInput
              type="text"
              value={workflowName}
              onChange={(event) => setWorkflowName(event.target.value)}
              placeholder="Workflow name"
              className="min-h-[40px] text-[13px]"
            />
          </div>
        </div>
        <PrimaryButton
          type="button"
          disabled
          className="shrink-0 min-h-[40px] text-[13px] font-[600] opacity-60"
        >
          Save workflow
        </PrimaryButton>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden h-full min-h-0 w-[280px] shrink-0 flex-col overflow-hidden bg-pure-mist/40 md:flex">
          <div className="shrink-0 px-4 py-4">
            <p className="text-[14px] font-[600] text-deep-onyx">Add nodes</p>
            <p className="mt-1 text-[12px] font-[500] text-gray-500">
              Drag onto the canvas or click to add a step.
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-2">
            {workflowPaletteItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.kind}
                  type="button"
                  draggable
                  onDragStart={(event) =>
                    onDragStart(
                      event,
                      item.kind,
                      item.label,
                      item.description,
                    )
                  }
                  onClick={() =>
                    addPaletteNode(item.kind, item.label, item.description)
                  }
                  className="flex w-full items-start gap-3 rounded-[12px] border-2 border-gray-200 bg-white px-3 py-3 text-left transition-all duration-200 hover:border-serene-purple/40 hover:bg-serene-purple/5 cursor-grab active:cursor-grabbing"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-serene-purple/10 text-serene-purple">
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-[600] text-deep-onyx">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] font-[500] text-gray-500 leading-snug">
                      {item.description}
                    </span>
                  </span>
                </button>
              );
            })}
            </div>
          </div>
        </aside>

        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          <div className="absolute left-4 top-4 z-10 md:hidden">
            <details className="group rounded-[12px] border-2 border-gray-200 bg-white shadow-sm">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-[13px] font-[600] text-deep-onyx">
                <Plus size={16} className="text-serene-purple" />
                Add node
              </summary>
              <div className="flex max-h-[240px] flex-col gap-2 overflow-y-auto border-t border-gray-100 p-2">
                {workflowPaletteItems.map((item) => (
                  <button
                    key={item.kind}
                    type="button"
                    onClick={() =>
                      addPaletteNode(item.kind, item.label, item.description)
                    }
                    className="rounded-[10px] px-3 py-2 text-left text-[12px] font-[500] text-gray-700 hover:bg-serene-purple/10 hover:text-serene-purple"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </details>
          </div>

          <div
            ref={reactFlowWrapperRef}
            className="workflow-builder-canvas h-full w-full"
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              defaultEdgeOptions={defaultEdgeOptions}
              defaultViewport={workflowDefaultViewport}
              minZoom={0.4}
              maxZoom={1.25}
              proOptions={{ hideAttribution: true }}
              deleteKeyCode={["Backspace", "Delete"]}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={20}
                size={1}
                color="#d1d5db"
              />
              <Controls
                showInteractive={false}
                className="!rounded-[12px] !border-0 !shadow-sm overflow-hidden [&>button]:!border-0 [&>button]:!border-b [&>button]:!border-gray-100 [&>button]:!bg-white [&>button]:hover:!bg-serene-purple/10 [&>button]:!text-deep-onyx"
              />
            </ReactFlow>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmailWorkflowBuilder(props: EmailWorkflowBuilderProps) {
  return (
    <ReactFlowProvider>
      <EmailWorkflowBuilderCanvas {...props} />
    </ReactFlowProvider>
  );
}
