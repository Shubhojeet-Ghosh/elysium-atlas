import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Bot,
  CircleStop,
  GitBranch,
  Mail,
  Play,
  Reply,
  Send,
  UserCheck,
  Webhook,
  Wrench,
} from "lucide-react";
import type { EmailFlowNodeType } from "@/utils/emailFlowsApi";

export type EmailFlowPaletteItem = {
  type: EmailFlowNodeType;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const EMAIL_FLOW_PALETTE_ITEMS: EmailFlowPaletteItem[] = [
  {
    type: "start",
    label: "Start",
    description: "Entry point for the inbound reply pipeline",
    icon: Play,
  },
  {
    type: "load_thread_context",
    label: "Load Thread Context",
    description: "Load inbox thread messages for the trigger email",
    icon: Mail,
  },
  {
    type: "read_kb",
    label: "Read KB",
    description: "Search team knowledge base for relevant context",
    icon: BookOpen,
  },
  {
    type: "read_tools",
    label: "Read Tools",
    description: "Plan and run registered agent tools",
    icon: Wrench,
  },
  {
    type: "ai_department_router",
    label: "AI Department Router",
    description: "Route the thread to a department using routing rules",
    icon: GitBranch,
  },
  {
    type: "ai_recipients_generator",
    label: "AI Recipients Generator",
    description: "Resolve CC/BCC recipients from recipient rules",
    icon: UserCheck,
  },
  {
    type: "generate_email",
    label: "Generate Email",
    description: "Draft the AI reply using the configured LLM",
    icon: Bot,
  },
  {
    type: "call_external_tool",
    label: "Call External Tool",
    description: "Run registered external tools after draft or send",
    icon: Webhook,
  },
  {
    type: "save_gmail_draft",
    label: "Save Gmail Draft",
    description: "Save the generated reply as a Gmail draft",
    icon: Reply,
  },
  {
    type: "send_email",
    label: "Send Email",
    description: "Auto-send when confidence threshold is met",
    icon: Send,
  },
  {
    type: "stop",
    label: "Stop",
    description: "End of the workflow pipeline",
    icon: CircleStop,
  },
];

const paletteItemByType = new Map(
  EMAIL_FLOW_PALETTE_ITEMS.map((item) => [item.type, item]),
);

export function getEmailFlowPaletteItem(type: EmailFlowNodeType) {
  return paletteItemByType.get(type);
}
