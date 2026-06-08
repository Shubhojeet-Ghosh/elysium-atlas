"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addEdge,
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  reconnectEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft, Link2, Unlink } from "lucide-react";
import { toast } from "sonner";
import CustomInput from "@/components/inputs/CustomInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Spinner from "@/components/ui/Spinner";
import {
  getEmailFlow,
  updateEmailFlow,
  type EmailFlowDetail,
  type EmailFlowLayout,
  type EmailFlowNodeType,
} from "@/utils/emailFlowsApi";
import {
  flowDocToReactFlow,
  reactFlowToFlowDoc,
  type EmailFlowNodeData,
} from "@/utils/flowDocToReactFlow";
import {
  createReactFlowNodeFromType,
  getNextPaletteNodePosition,
  getUniqueNodeId,
  isTailNode,
} from "@/utils/workflowGraphUtils";
import {
  EMAIL_FLOW_PALETTE_ITEMS,
  getEmailFlowPaletteItem,
} from "./emailFlowConfig";
import { emailFlowNodeTypes } from "./emailFlowNodeTypes";
import EmailWorkflowEdgePanel from "./EmailWorkflowEdgePanel";
import EmailWorkflowNodePanel, {
  getSelectedNodeData,
} from "./EmailWorkflowNodePanel";

const defaultEdgeOptions = {
  style: { stroke: "#6c5f8d", strokeWidth: 2 },
};

function FitViewOnLoad({ ready }: { ready: boolean }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (!ready) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      void fitView({ padding: 0.25, maxZoom: 1.1, duration: 200 });
    });

    return () => cancelAnimationFrame(frame);
  }, [ready, fitView]);

  return null;
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function applyFlowToGraph(flowData: EmailFlowDetail) {
  return flowDocToReactFlow(
    flowData.nodes ?? [],
    flowData.layout ?? {},
    flowData.edges ?? null,
  );
}

interface EmailWorkflowBuilderProps {
  flowId: string;
  onClose: () => void;
  onSaved?: () => void;
  initialFlow?: EmailFlowDetail | null;
}

function EmailWorkflowBuilderCanvas({
  flowId,
  onClose,
  onSaved,
  initialFlow,
}: EmailWorkflowBuilderProps) {
  const [flow, setFlow] = useState<EmailFlowDetail | null>(null);
  const [workflowName, setWorkflowName] = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<EmailFlowNodeData>>(
    [],
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const layout = useMemo<EmailFlowLayout>(() => flow?.layout ?? {}, [flow?.layout]);
  const isEditable = Boolean(flow?.is_editable && !flow?.is_read_only);

  const activeNodeTypes = useMemo(() => {
    const set = new Set<string>();
    nodes.forEach((node) => set.add(String(node.type ?? node.data.nodeType)));
    return set;
  }, [nodes]);

  const paletteTypes = useMemo(() => {
    if (flow?.palette_node_types?.length) {
      return flow.palette_node_types;
    }
    return EMAIL_FLOW_PALETTE_ITEMS.map((item) => item.type);
  }, [flow?.palette_node_types]);

  const paletteItems = useMemo(
    () =>
      paletteTypes.map((type) => {
        const configured = getEmailFlowPaletteItem(type);
        return (
          configured ?? {
            type,
            label: type,
            description: "",
            icon: EMAIL_FLOW_PALETTE_ITEMS[0].icon,
          }
        );
      }),
    [paletteTypes],
  );

  const selectedNode = useMemo(
    () => getSelectedNodeData(nodes, selectedNodeId),
    [nodes, selectedNodeId],
  );

  const selectedEdge = useMemo(() => {
    if (!selectedEdgeId) {
      return null;
    }
    const edge = edges.find((entry) => entry.id === selectedEdgeId);
    if (!edge) {
      return null;
    }
    const sourceNode = nodes.find((node) => node.id === edge.source);
    const targetNode = nodes.find((node) => node.id === edge.target);
    return {
      id: edge.id,
      sourceLabel: sourceNode?.data.label ?? edge.source,
      targetLabel: targetNode?.data.label ?? edge.target,
    };
  }, [edges, nodes, selectedEdgeId]);

  const styledEdges = useMemo<Edge[]>(
    () =>
      edges.map((edge) => ({
        ...edge,
        selected: edge.id === selectedEdgeId,
        style: {
          stroke: "#6c5f8d",
          strokeWidth: edge.id === selectedEdgeId ? 3 : 2,
        },
      })),
    [edges, selectedEdgeId],
  );

  const getNodeType = useCallback((node: Node<EmailFlowNodeData>) => {
    return (node.type ?? node.data.nodeType) as EmailFlowNodeType;
  }, []);

  const loadGraphFromFlow = useCallback(
    (flowData: EmailFlowDetail) => {
      const graph = applyFlowToGraph(flowData);
      setFlow(flowData);
      setWorkflowName(flowData.name ?? "");
      setNodes(graph.nodes);
      setEdges(graph.edges);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setIsDirty(false);
    },
    [setEdges, setNodes],
  );

  const fetchFlow = useCallback(async () => {
    if (initialFlow?.flow_id === flowId) {
      loadGraphFromFlow(initialFlow);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await getEmailFlow(flowId);
      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to load workflow.");
      }
      loadGraphFromFlow(response.data);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load workflow."));
      setFlow(null);
      setNodes([]);
      setEdges([]);
    } finally {
      setIsLoading(false);
    }
  }, [flowId, initialFlow, loadGraphFromFlow, setEdges, setNodes]);

  useEffect(() => {
    void fetchFlow();
  }, [fetchFlow]);

  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

  const handleNodesChange = useCallback(
    (changes: NodeChange<Node<EmailFlowNodeData>>[]) => {
      onNodesChange(changes);

      for (const change of changes) {
        if (change.type === "remove" && change.id === selectedNodeId) {
          setSelectedNodeId(null);
        }
      }

      if (
        changes.some(
          (change) => change.type === "remove" || change.type === "position",
        )
      ) {
        markDirty();
      }
    },
    [markDirty, onNodesChange, selectedNodeId],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);

      for (const change of changes) {
        if (change.type === "remove" && change.id === selectedEdgeId) {
          setSelectedEdgeId(null);
        }
      }

      if (changes.some((change) => change.type === "remove" || change.type === "add")) {
        markDirty();
      }
    },
    [markDirty, onEdgesChange, selectedEdgeId],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!isEditable) {
        return;
      }

      setEdges((currentEdges) =>
        addEdge(
          {
            ...connection,
            type: layout.edge_type ?? "straight",
            style: { stroke: "#6c5f8d", strokeWidth: 2 },
          },
          currentEdges,
        ),
      );
      markDirty();
    },
    [isEditable, layout.edge_type, markDirty, setEdges],
  );

  const onReconnect = useCallback(
    (oldEdge: Edge, connection: Connection) => {
      if (!isEditable) {
        return;
      }

      setEdges((currentEdges) =>
        reconnectEdge(oldEdge, connection, currentEdges),
      );
      markDirty();
    },
    [isEditable, markDirty, setEdges],
  );

  const handlePaletteClick = (type: EmailFlowNodeType) => {
    if (!isEditable) {
      return;
    }

    const nodeId = getUniqueNodeId(
      type,
      nodes.map((node) => node.id),
    );
    const position = getNextPaletteNodePosition(nodes, layout);
    const newNode = createReactFlowNodeFromType(type, layout, position, nodeId);
    setNodes((currentNodes) => [...currentNodes, newNode]);
    setSelectedNodeId(newNode.id);
    setSelectedEdgeId(null);
    markDirty();
  };

  const handleNodeConfigChange = (config: Record<string, unknown>) => {
    if (!selectedNodeId || !isEditable) {
      return;
    }

    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === selectedNodeId
          ? {
              ...node,
              data: {
                ...node.data,
                config,
              },
            }
          : node,
      ),
    );
    setIsDirty(true);
  };

  const handleDeleteSelectedNode = useCallback(() => {
    if (!selectedNodeId || !isEditable) {
      return;
    }

    setNodes((currentNodes) =>
      currentNodes.filter((entry) => entry.id !== selectedNodeId),
    );
    setEdges((currentEdges) =>
      currentEdges.filter(
        (edge) =>
          edge.source !== selectedNodeId && edge.target !== selectedNodeId,
      ),
    );
    setSelectedNodeId(null);
    markDirty();
  }, [isEditable, markDirty, selectedNodeId, setEdges, setNodes]);

  const handleDeleteSelectedEdge = useCallback(() => {
    if (!selectedEdgeId || !isEditable) {
      return;
    }

    setEdges((currentEdges) =>
      currentEdges.filter((edge) => edge.id !== selectedEdgeId),
    );
    setSelectedEdgeId(null);
    markDirty();
  }, [isEditable, markDirty, selectedEdgeId, setEdges]);

  const handleSwapTail = (tailType: "save_gmail_draft" | "send_email") => {
    if (!selectedNodeId || !isEditable || !isTailNode(tailType)) {
      return;
    }

    const node = nodes.find((entry) => entry.id === selectedNodeId);
    if (!node || !isTailNode(getNodeType(node))) {
      return;
    }

    const paletteItem = getEmailFlowPaletteItem(tailType);
    const defaultConfig =
      tailType === "send_email"
        ? {
            reply_action: {
              mode: "auto_send",
              auto_send_min_confidence: 0.8,
            },
          }
        : { reply_action: { mode: "draft" } };

    setNodes((currentNodes) =>
      currentNodes.map((entry) =>
        entry.id === selectedNodeId
          ? {
              ...entry,
              id: tailType,
              type: tailType,
              data: {
                ...entry.data,
                label: paletteItem?.label ?? tailType,
                nodeType: tailType,
                config: defaultConfig,
              },
            }
          : entry,
      ),
    );
    setEdges((currentEdges) =>
      currentEdges.map((edge) => ({
        ...edge,
        source: edge.source === selectedNodeId ? tailType : edge.source,
        target: edge.target === selectedNodeId ? tailType : edge.target,
      })),
    );
    setSelectedNodeId(tailType);
    markDirty();
  };

  const handleSave = async () => {
    if (!flow || !isEditable) {
      return;
    }

    const trimmedName = workflowName.trim();
    if (!trimmedName) {
      toast.error("Workflow name is required.");
      return;
    }

    setIsSaving(true);
    try {
      const payloadNodes = reactFlowToFlowDoc(nodes, edges, layout);
      const response = await updateEmailFlow(flowId, payloadNodes, trimmedName);

      if (!response.success || !response.data) {
        throw new Error(response.message || "Failed to save workflow.");
      }

      loadGraphFromFlow(response.data);
      onSaved?.();

      let syncedMessage = "";
      if (response.data.agent_synced === true) {
        const fields = response.data.agent_synced_fields;
        syncedMessage =
          fields && fields.length > 0
            ? ` Linked agent synced: ${fields.join(", ")}.`
            : " Linked agent settings were synced.";
      }

      toast.success(
        (response.message || "Workflow saved successfully.") + syncedMessage,
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to save workflow."));
    } finally {
      setIsSaving(false);
    }
  };

  const closeNodePanel = useCallback(() => {
    setSelectedNodeId(null);
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({ ...node, selected: false })),
    );
  }, [setNodes]);

  const closeEdgePanel = useCallback(() => {
    setSelectedEdgeId(null);
    setEdges((currentEdges) =>
      currentEdges.map((edge) => ({ ...edge, selected: false })),
    );
  }, [setEdges]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[12px] bg-white">
      <header className="flex shrink-0 flex-col gap-3 px-4 py-3">
        <div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to workflows"
            className="flex h-9 w-9 items-center justify-center text-gray-600 transition-colors duration-200 hover:text-serene-purple cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1 max-w-[420px]">
            {isEditable ? (
              <CustomInput
                type="text"
                value={workflowName}
                onChange={(event) => {
                  setWorkflowName(event.target.value);
                  setIsDirty(true);
                }}
                placeholder="Workflow name"
                className="min-h-[40px] text-[13px]"
              />
            ) : (
              <p className="truncate text-[15px] font-[700] text-deep-onyx">
                {flow?.name ?? "Workflow"}
              </p>
            )}
            {flow ? (
              flow.is_attached && flow.attached_agent_name ? (
                <p className="mt-1 inline-flex items-center gap-1 truncate text-[11px] font-[600] text-serene-purple">
                  <Link2 size={12} aria-hidden />
                  Attached to {flow.attached_agent_name}
                </p>
              ) : (
                <p className="mt-1 inline-flex items-center gap-1 truncate text-[11px] font-[600] text-gray-500">
                  <Unlink size={12} aria-hidden />
                  Unattached
                </p>
              )
            ) : null}
          </div>
          {isEditable ? (
            <PrimaryButton
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving || isLoading || !workflowName.trim() || !isDirty}
              className="shrink-0 min-h-[40px] text-[13px] font-[600]"
            >
              {isSaving ? <Spinner className="border-white" /> : "Save changes"}
            </PrimaryButton>
          ) : (
            <span className="shrink-0 rounded-full border border-gray-200 bg-pure-mist px-3 py-1 text-[11px] font-[600] uppercase tracking-wide text-gray-600">
              Read-only
            </span>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden h-full min-h-0 w-[280px] shrink-0 flex-col overflow-hidden border-r border-gray-100 bg-pure-mist/40 md:flex">
          <div className="shrink-0 px-4 py-4">
            <p className="text-[14px] font-[600] text-deep-onyx">Node palette</p>
            <p className="mt-1 text-[12px] font-[500] text-gray-500">
              {isEditable
                ? "Click to add nodes. Connect, move, and delete freely — Save validates on the server."
                : "This workflow is read-only."}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-2">
              {paletteItems.map((item) => {
                const Icon = item.icon;
                const isOnCanvas = activeNodeTypes.has(item.type);

                return (
                  <button
                    key={item.type}
                    type="button"
                    disabled={!isEditable}
                    onClick={() => handlePaletteClick(item.type)}
                    className={`flex w-full items-start gap-3 rounded-[12px] border-2 px-3 py-3 text-left transition-all border-gray-200 bg-white ${
                      isOnCanvas ? "border-serene-purple/30" : ""
                    } ${isEditable ? "cursor-pointer hover:border-serene-purple/40 hover:bg-serene-purple/5" : "cursor-default opacity-60"}`}
                  >
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] ${
                        isOnCanvas
                          ? "bg-serene-purple/10 text-serene-purple"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
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
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Spinner />
            </div>
          ) : flow ? (
            <div className="workflow-builder-canvas h-full w-full">
              <ReactFlow
                nodes={nodes}
                edges={styledEdges}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onConnect={onConnect}
                onReconnect={onReconnect}
                deleteKeyCode={["Backspace", "Delete"]}
                onNodeClick={(_, node) => {
                  setSelectedNodeId(node.id);
                  setSelectedEdgeId(null);
                }}
                onEdgeClick={(_, edge) => {
                  setSelectedEdgeId(edge.id);
                  setSelectedNodeId(null);
                }}
                onPaneClick={() => {
                  setSelectedNodeId(null);
                  setSelectedEdgeId(null);
                }}
                nodeTypes={emailFlowNodeTypes}
                nodeOrigin={layout.node_origin ?? [0, 0]}
                defaultEdgeOptions={{
                  ...defaultEdgeOptions,
                  type: layout.edge_type ?? "straight",
                }}
                connectionMode={ConnectionMode.Loose}
                minZoom={0.3}
                maxZoom={1.25}
                nodesDraggable={isEditable}
                nodesConnectable={isEditable}
                elementsSelectable={isEditable}
                edgesReconnectable={isEditable}
                isValidConnection={() => isEditable}
                proOptions={{ hideAttribution: true }}
              >
                <FitViewOnLoad ready={nodes.length > 0} />
                <Background
                  variant={BackgroundVariant.Dots}
                  gap={20}
                  size={1.25}
                  color="#94a3b8"
                />
                <Controls
                  showInteractive={false}
                  className="!rounded-[12px] !border-0 !shadow-sm overflow-hidden [&>button]:!border-0 [&>button]:!border-b [&>button]:!border-gray-100 [&>button]:!bg-white [&>button]:hover:!bg-serene-purple/10 [&>button]:!text-deep-onyx"
                />
              </ReactFlow>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-[13px] text-gray-500">
              Unable to load this workflow.
            </div>
          )}
        </div>

        {(selectedNode || selectedEdge) && flow ? (
          <aside className="hidden h-full min-h-0 w-[320px] shrink-0 flex-col overflow-hidden border-l border-gray-100 bg-white md:flex">
            {selectedNode ? (
              <EmailWorkflowNodePanel
                nodeType={selectedNode.type}
                config={selectedNode.config}
                isEditable={isEditable}
                onConfigChange={handleNodeConfigChange}
                onDelete={handleDeleteSelectedNode}
                onSwapTail={handleSwapTail}
                onClose={closeNodePanel}
              />
            ) : selectedEdge ? (
              <EmailWorkflowEdgePanel
                edgeId={selectedEdge.id}
                sourceLabel={selectedEdge.sourceLabel}
                targetLabel={selectedEdge.targetLabel}
                isEditable={isEditable}
                onDelete={handleDeleteSelectedEdge}
                onClose={closeEdgePanel}
              />
            ) : null}
          </aside>
        ) : null}
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
