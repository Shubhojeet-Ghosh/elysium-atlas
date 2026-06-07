import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpen,
  Bot,
  Building2,
  CircleStop,
  Clock,
  GitBranch,
  Mail,
  Reply,
  Tags,
  UserCheck,
  Webhook,
  Wrench,
} from "lucide-react";

export type WorkflowNodeKind =
  | "trigger"
  | "agent"
  | "condition"
  | "action"
  | "knowledge"
  | "tool"
  | "classify"
  | "assign"
  | "review"
  | "delay"
  | "notify"
  | "webhook"
  | "end";
export type WorkflowNodeData = {
  label: string;
  description: string;
  kind: WorkflowNodeKind;
};

export type WorkflowPaletteItem = {
  type: "workflowNode";
  kind: WorkflowNodeKind;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const WORKFLOW_NODE_TYPE = "workflowNode";

export const workflowPaletteItems: WorkflowPaletteItem[] = [
  {
    type: WORKFLOW_NODE_TYPE,
    kind: "trigger",
    label: "Email Trigger",
    description: "Start when a new email arrives",
    icon: Mail,
  },
  {
    type: WORKFLOW_NODE_TYPE,
    kind: "agent",
    label: "AI Agent",
    description: "Run an email AI agent step",
    icon: Bot,
  },
  {
    type: WORKFLOW_NODE_TYPE,
    kind: "knowledge",
    label: "Knowledge Base",
    description: "Search team knowledge for context",
    icon: BookOpen,
  },
  {
    type: WORKFLOW_NODE_TYPE,
    kind: "tool",
    label: "Tool Call",
    description: "Run a registered agent tool",
    icon: Wrench,
  },
  {
    type: WORKFLOW_NODE_TYPE,
    kind: "classify",
    label: "Classify Intent",
    description: "Detect topic or intent from the email",
    icon: Tags,
  },
  {
    type: WORKFLOW_NODE_TYPE,
    kind: "condition",
    label: "Condition",
    description: "Branch based on rules",
    icon: GitBranch,
  },
  {
    type: WORKFLOW_NODE_TYPE,
    kind: "assign",
    label: "Assign Department",
    description: "Route the thread to a department",
    icon: Building2,
  },
  {
    type: WORKFLOW_NODE_TYPE,
    kind: "review",
    label: "Human Review",
    description: "Require approval before continuing",
    icon: UserCheck,
  },
  {
    type: WORKFLOW_NODE_TYPE,
    kind: "action",
    label: "Send Reply",
    description: "Send an automated reply",
    icon: Reply,
  },
  {
    type: WORKFLOW_NODE_TYPE,
    kind: "notify",
    label: "Notify Team",
    description: "Send an internal team notification",
    icon: Bell,
  },
  {
    type: WORKFLOW_NODE_TYPE,
    kind: "webhook",
    label: "Webhook",
    description: "Call an external HTTP endpoint",
    icon: Webhook,
  },
  {
    type: WORKFLOW_NODE_TYPE,
    kind: "delay",
    label: "Wait",
    description: "Pause before the next step",
    icon: Clock,
  },
  {
    type: WORKFLOW_NODE_TYPE,
    kind: "end",
    label: "End",
    description: "Stop the workflow",
    icon: CircleStop,
  },
];

export const initialWorkflowNodes = [
  {
    id: "trigger-1",
    type: WORKFLOW_NODE_TYPE,
    position: { x: 280, y: 80 },
    data: {
      label: "Email received",
      description: "When a new inbox email arrives",
      kind: "trigger" as const,
    },
  },
];
