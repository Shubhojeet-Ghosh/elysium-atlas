import type { Node } from "@xyflow/react";
import type {
  EmailFlowLayout,
  EmailFlowNodeDoc,
  EmailFlowNodeType,
} from "@/utils/emailFlowsApi";
import { getEmailFlowPaletteItem } from "@/components/ElysiumAtlas/email/workflow/emailFlowConfig";
import {
  flowDocToReactFlow,
  type EmailFlowNodeData,
} from "@/utils/flowDocToReactFlow";

export const OPTIONAL_MIDDLE_ORDER: EmailFlowNodeType[] = [
  "read_kb",
  "read_tools",
  "ai_department_router",
  "ai_recipients_generator",
];

export const TAIL_NODE_TYPES: EmailFlowNodeType[] = [
  "save_gmail_draft",
  "send_email",
];

export const MANDATORY_NODE_TYPES = new Set<EmailFlowNodeType>([
  "start",
  "load_thread_context",
  "generate_email",
  "stop",
]);

export function isMandatoryNodeType(type: EmailFlowNodeType) {
  return MANDATORY_NODE_TYPES.has(type);
}

export function canDeleteNodeType(type: EmailFlowNodeType) {
  return !isMandatoryNodeType(type);
}

export function isOptionalMiddleNode(type: EmailFlowNodeType) {
  return OPTIONAL_MIDDLE_ORDER.includes(type);
}

export function isTailNode(type: EmailFlowNodeType) {
  return TAIL_NODE_TYPES.includes(type);
}

export function getLinearChain(nodes: EmailFlowNodeDoc[]): string[] {
  const byId = new Map(nodes.map((node) => [node.node_id, node]));
  const startNode = nodes.find((node) => node.type === "start");
  if (!startNode) {
    return nodes.map((node) => node.node_id);
  }

  const chain: string[] = [];
  let current: string | undefined = startNode.node_id;
  const visited = new Set<string>();

  while (current && !visited.has(current)) {
    visited.add(current);
    chain.push(current);
    const node = byId.get(current);
    current = node?.edges?.[0]?.to;
  }

  return chain;
}

export function rebuildChainEdges(
  nodes: EmailFlowNodeDoc[],
  chain: string[],
): EmailFlowNodeDoc[] {
  const nodeById = new Map(
    nodes.map((node) => [node.node_id, { ...node, edges: [] as EmailFlowNodeDoc["edges"] }]),
  );

  chain.forEach((nodeId, index) => {
    const node = nodeById.get(nodeId);
    if (!node) {
      return;
    }
    if (index < chain.length - 1) {
      node.edges = [{ to: chain[index + 1] }];
    } else {
      node.edges = [];
    }
  });

  return Array.from(nodeById.values());
}

export function reindexHorizontalPositions(
  nodes: EmailFlowNodeDoc[],
  layout?: EmailFlowLayout,
): EmailFlowNodeDoc[] {
  const chain = getLinearChain(nodes);
  const stepX = layout?.step_x ?? 320;
  const rowY = layout?.row_y ?? 80;
  const nodeWidth = layout?.node_width ?? 280;
  const nodeHeight = layout?.node_height ?? 72;

  const nodeById = new Map(nodes.map((node) => [node.node_id, { ...node }]));

  chain.forEach((nodeId, index) => {
    const node = nodeById.get(nodeId);
    if (!node) {
      return;
    }
    node.position = { x: index * stepX, y: rowY };
    node.dimensions = {
      width: node.dimensions?.width ?? nodeWidth,
      height: node.dimensions?.height ?? nodeHeight,
    };
  });

  return Array.from(nodeById.values());
}

function createNodeDoc(
  type: EmailFlowNodeType,
  layout?: EmailFlowLayout,
): EmailFlowNodeDoc {
  const paletteItem = getEmailFlowPaletteItem(type);
  const nodeWidth = layout?.node_width ?? 280;
  const nodeHeight = layout?.node_height ?? 72;

  const defaultConfig: Record<string, unknown> = {};
  if (type === "read_tools") {
    defaultConfig.tool_ids = [];
  }
  if (type === "ai_department_router") {
    defaultConfig.routing_rule_ids = [];
  }
  if (type === "ai_recipients_generator") {
    defaultConfig.recipient_rule_ids = [];
  }
  if (type === "generate_email") {
    defaultConfig.format_prompt = "";
    defaultConfig.llm_model = "gpt-4o-mini";
  }
  if (type === "save_gmail_draft") {
    defaultConfig.reply_action = { mode: "draft" };
  }
  if (type === "send_email") {
    defaultConfig.reply_action = {
      mode: "auto_send",
      auto_send_min_confidence: 0.8,
    };
  }
  if (type === "call_external_tool") {
    defaultConfig.external_tools = [];
  }

  return {
    node_id: type,
    type,
    label: paletteItem?.label ?? type,
    position: { x: 0, y: layout?.row_y ?? 80 },
    dimensions: { width: nodeWidth, height: nodeHeight },
    config: defaultConfig,
    edges: [],
  };
}

export function insertOptionalNode(
  nodes: EmailFlowNodeDoc[],
  type: EmailFlowNodeType,
  layout?: EmailFlowLayout,
): EmailFlowNodeDoc[] {
  if (!isOptionalMiddleNode(type)) {
    return nodes;
  }

  if (nodes.some((node) => node.type === type)) {
    return nodes;
  }

  const chain = getLinearChain(nodes);
  const generateIndex = chain.findIndex(
    (nodeId) => nodes.find((node) => node.node_id === nodeId)?.type === "generate_email",
  );
  if (generateIndex <= 0) {
    return nodes;
  }

  const optionalRank = OPTIONAL_MIDDLE_ORDER.indexOf(type);
  let insertIndex = generateIndex;

  for (let index = generateIndex - 1; index > 0; index -= 1) {
    const nodeType = nodes.find((node) => node.node_id === chain[index])?.type;
    if (!nodeType || !isOptionalMiddleNode(nodeType)) {
      insertIndex = index + 1;
      break;
    }
    const existingRank = OPTIONAL_MIDDLE_ORDER.indexOf(nodeType);
    if (existingRank < optionalRank) {
      insertIndex = index + 1;
      break;
    }
    insertIndex = index;
  }

  const newChain = [...chain];
  newChain.splice(insertIndex, 0, type);
  const newNode = createNodeDoc(type, layout);
  const mergedNodes = [...nodes, newNode];
  const rewired = rebuildChainEdges(mergedNodes, newChain);
  return reindexHorizontalPositions(rewired, layout);
}

export function removeOptionalNode(
  nodes: EmailFlowNodeDoc[],
  nodeId: string,
  layout?: EmailFlowLayout,
): EmailFlowNodeDoc[] {
  const target = nodes.find((node) => node.node_id === nodeId);
  if (!target || !canDeleteNodeType(target.type)) {
    return nodes;
  }

  const chain = getLinearChain(nodes).filter((id) => id !== nodeId);
  const remaining = nodes.filter((node) => node.node_id !== nodeId);
  const rewired = rebuildChainEdges(remaining, chain);
  return reindexHorizontalPositions(rewired, layout);
}

export function swapTailNode(
  nodes: EmailFlowNodeDoc[],
  newTailType: EmailFlowNodeType,
  layout?: EmailFlowLayout,
): EmailFlowNodeDoc[] {
  if (!isTailNode(newTailType)) {
    return nodes;
  }

  const currentTail = nodes.find((node) => isTailNode(node.type));
  if (!currentTail || currentTail.type === newTailType) {
    if (!currentTail) {
      const chain = getLinearChain(nodes);
      const stopIndex = chain.findIndex(
        (nodeId) => nodes.find((node) => node.node_id === nodeId)?.type === "stop",
      );
      if (stopIndex <= 0) {
        return nodes;
      }
      const newChain = [...chain];
      newChain.splice(stopIndex, 0, newTailType);
      const mergedNodes = [...nodes, createNodeDoc(newTailType, layout)];
      const rewired = rebuildChainEdges(mergedNodes, newChain);
      return reindexHorizontalPositions(rewired, layout);
    }
    return nodes;
  }

  const chain = getLinearChain(nodes);
  const tailIndex = chain.indexOf(currentTail.node_id);
  if (tailIndex < 0) {
    return nodes;
  }

  const newTail = createNodeDoc(newTailType, layout);
  newTail.position = currentTail.position;
  newTail.dimensions = currentTail.dimensions;

  if (newTailType === "send_email") {
    const existingReplyAction =
      currentTail.config?.reply_action &&
      typeof currentTail.config.reply_action === "object"
        ? (currentTail.config.reply_action as {
            auto_send_min_confidence?: number;
          })
        : {};
    newTail.config = {
      reply_action: {
        mode: "auto_send",
        auto_send_min_confidence:
          typeof existingReplyAction.auto_send_min_confidence === "number"
            ? existingReplyAction.auto_send_min_confidence
            : 0.8,
      },
    };
  } else {
    newTail.config = { reply_action: { mode: "draft" } };
  }

  const newChain = [...chain];
  newChain[tailIndex] = newTailType;
  const remaining = nodes.filter((node) => node.node_id !== currentTail.node_id);
  const mergedNodes = [...remaining, newTail];
  const rewired = rebuildChainEdges(mergedNodes, newChain);
  return reindexHorizontalPositions(rewired, layout);
}

export function getNextPaletteNodePosition(
  nodes: Array<{ position: { x: number; y: number } }>,
  layout: EmailFlowLayout = {},
) {
  const stepX = layout.step_x ?? 200;
  const rowY = layout.row_y ?? 80;

  if (nodes.length === 0) {
    return { x: 0, y: rowY };
  }

  const maxX = Math.max(...nodes.map((node) => node.position.x));
  return { x: maxX + stepX, y: rowY };
}

export function createReactFlowNodeFromType(
  type: EmailFlowNodeType,
  layout: EmailFlowLayout,
  position: { x: number; y: number },
  nodeId?: string,
): Node<EmailFlowNodeData> {
  const doc = createNodeDoc(type, layout);
  doc.node_id = nodeId ?? type;
  doc.position = position;
  const { nodes } = flowDocToReactFlow([doc], layout, null);
  return nodes[0]!;
}

export function getUniqueNodeId(
  type: EmailFlowNodeType,
  existingNodeIds: Iterable<string>,
) {
  const ids = new Set(existingNodeIds);
  if (!ids.has(type)) {
    return type;
  }

  let index = 2;
  while (ids.has(`${type}_${index}`)) {
    index += 1;
  }
  return `${type}_${index}`;
}
