import type { Edge, Node } from "@xyflow/react";
import type {
  EmailFlowApiEdge,
  EmailFlowLayout,
  EmailFlowNodeDoc,
  EmailFlowNodeType,
} from "@/utils/emailFlowsApi";

export interface EmailFlowNodeData extends Record<string, unknown> {
  label: string;
  config: Record<string, unknown>;
  binding: Record<string, unknown>;
  nodeType: EmailFlowNodeType;
}

function normalizeFlowNodeConfigForSave(
  nodeType: EmailFlowNodeType,
  config: Record<string, unknown>,
): Record<string, unknown> {
  if (nodeType !== "call_external_tool") {
    return config;
  }

  const next = { ...config };
  if (!Array.isArray(next.external_tools) && Array.isArray(next.tool_ids)) {
    next.external_tools = next.tool_ids;
  }
  delete next.tool_ids;
  return next;
}

export function flowDocToReactFlow(
  flowNodes: EmailFlowNodeDoc[],
  layout: EmailFlowLayout = {},
  apiEdges: EmailFlowApiEdge[] | null = null,
) {
  const nodeWidth = layout.node_width ?? 280;
  const nodeHeight = layout.node_height ?? 72;
  const edgeType = layout.edge_type ?? "straight";
  const sourceHandle = layout.source_handle ?? "right";
  const targetHandle = layout.target_handle ?? "left";

  const nodes: Node<EmailFlowNodeData>[] = flowNodes.map((node) => ({
    id: node.node_id,
    type: node.type,
    position: node.position ?? { x: 0, y: 0 },
    style: {
      width: node.dimensions?.width ?? nodeWidth,
      height: node.dimensions?.height ?? nodeHeight,
    },
    draggable: true,
    selectable: true,
    data: {
      label: node.label ?? node.type,
      config: node.config ?? {},
      binding: (node.binding ?? {}) as Record<string, unknown>,
      nodeType: node.type,
    },
  }));

  const edges: Edge[] =
    apiEdges ??
    flowNodes.flatMap((node) =>
      (node.edges ?? []).map((edge) => ({
        id: `${node.node_id}-${edge.to}`,
        source: node.node_id,
        target: edge.to,
        type: edgeType,
        sourceHandle,
        targetHandle,
      })),
    );

  return { nodes, edges };
}

export function reactFlowToFlowDoc(
  nodes: Node<EmailFlowNodeData>[],
  edges: Edge[],
  layout: EmailFlowLayout = {},
): EmailFlowNodeDoc[] {
  const nodeWidth = layout.node_width ?? 280;
  const nodeHeight = layout.node_height ?? 72;
  const outgoing = new Map<string, string[]>();

  edges.forEach((edge) => {
    const targets = outgoing.get(edge.source) ?? [];
    targets.push(edge.target);
    outgoing.set(edge.source, targets);
  });

  return nodes.map((node) => {
    const width =
      typeof node.style?.width === "number"
        ? node.style.width
        : typeof node.width === "number"
          ? node.width
          : nodeWidth;
    const height =
      typeof node.style?.height === "number"
        ? node.style.height
        : typeof node.height === "number"
          ? node.height
          : nodeHeight;

    const nodeType = (node.type ?? node.data.nodeType) as EmailFlowNodeType;
    const config = normalizeFlowNodeConfigForSave(
      nodeType,
      node.data.config ?? {},
    );

    return {
      node_id: node.id,
      type: nodeType,
      label: node.data.label,
      position: node.position,
      dimensions: { width, height },
      config,
      edges: (outgoing.get(node.id) ?? []).map((to) => ({ to })),
    };
  });
}
