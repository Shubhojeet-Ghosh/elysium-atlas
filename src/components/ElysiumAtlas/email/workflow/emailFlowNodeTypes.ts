import type { NodeTypes } from "@xyflow/react";
import EmailFlowNode from "./EmailFlowNode";

export const emailFlowNodeTypes = {
  start: EmailFlowNode,
  load_thread_context: EmailFlowNode,
  read_kb: EmailFlowNode,
  read_tools: EmailFlowNode,
  ai_department_router: EmailFlowNode,
  ai_recipients_generator: EmailFlowNode,
  generate_email: EmailFlowNode,
  call_external_tool: EmailFlowNode,
  save_gmail_draft: EmailFlowNode,
  send_email: EmailFlowNode,
  stop: EmailFlowNode,
} satisfies NodeTypes;
