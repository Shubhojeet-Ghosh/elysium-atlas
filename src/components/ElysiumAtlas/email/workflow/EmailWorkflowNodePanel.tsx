"use client";

import { useMemo } from "react";
import { Trash2, X } from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import AutoComplete from "@/components/ui/AutoComplete";
import CustomTextareaPrimary from "@/components/inputs/CustomTextareaPrimary";
import EmailUserMultiSelect from "@/components/ElysiumAtlas/email/EmailUserMultiSelect";
import { Slider } from "@/components/ui/slider";
import { useAppSelector } from "@/store";
import type { EmailFlowNodeType } from "@/utils/emailFlowsApi";
import type { EmailFlowNodeData } from "@/utils/flowDocToReactFlow";
import { AVAILABLE_MODELS } from "@/lib/llmConfig";

const RECIPIENT_RULE_LABEL_LENGTH = 60;
const GENERATE_EMAIL_FORMAT_TEMPLATE_PLACEHOLDER = `Hi {{customer_name}},

Thank you for reaching out.

{{main_response}}

{{additional_information}}

Best regards,
Support Team`;

function truncateRuleLabel(text: string, maxLength = RECIPIENT_RULE_LABEL_LENGTH) {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength).trim()}…`;
}

interface EmailWorkflowNodePanelProps {
  nodeType: EmailFlowNodeType;
  config: Record<string, unknown>;
  isEditable: boolean;
  onConfigChange: (config: Record<string, unknown>) => void;
  onDelete?: () => void;
  onSwapTail?: (tailType: "save_gmail_draft" | "send_email") => void;
  onClose: () => void;
}

export default function EmailWorkflowNodePanel({
  nodeType,
  config,
  isEditable,
  onConfigChange,
  onDelete,
  onSwapTail,
  onClose,
}: EmailWorkflowNodePanelProps) {
  const knowledgeItems = useAppSelector(
    (state) => state.emailKnowledge.knowledgeItems,
  );
  const teamTools = useAppSelector((state) => state.emailTools.tools);
  const routingRules = useAppSelector((state) => state.rules.routingRules);
  const recipientRules = useAppSelector((state) => state.rules.recipientRules);

  const knowledgeItemsList = useMemo(
    () =>
      knowledgeItems.map((item) => ({
        value: item.knowledge_id,
        label: item.title,
      })),
    [knowledgeItems],
  );

  const toolItems = useMemo(
    () =>
      teamTools
        .filter((tool) => tool.status === "active" || !tool.status)
        .map((tool) => ({
          value: tool.tool_id,
          label: tool.display_name,
        })),
    [teamTools],
  );

  const routingRuleItems = useMemo(
    () =>
      routingRules
        .filter((rule) => rule.status === "active" || !rule.status)
        .map((rule) => ({
          value: rule.routing_rule_id,
          label: rule.rule_name,
        })),
    [routingRules],
  );

  const recipientRuleItems = useMemo(
    () =>
      recipientRules.map((rule) => ({
        value: rule.recipient_rule_id,
        label:
          rule.rule_name?.trim() ||
          truncateRuleLabel(rule.recipient_prompt) ||
          rule.recipient_rule_id,
      })),
    [recipientRules],
  );

  const llmModelItems = useMemo(
    () =>
      AVAILABLE_MODELS.map((model) => ({
        value: model.model_code,
        label: model.model_code,
        icon: model.model_icon,
      })),
    [],
  );

  const selectedKnowledgeId =
    typeof config.knowledge_id === "string" ? config.knowledge_id : "";
  const selectedToolIds = Array.isArray(config.tool_ids)
    ? config.tool_ids.filter((id): id is string => typeof id === "string")
    : [];
  const selectedRoutingRuleIds = Array.isArray(config.routing_rule_ids)
    ? config.routing_rule_ids.filter((id): id is string => typeof id === "string")
    : [];
  const selectedRecipientRuleIds = Array.isArray(config.recipient_rule_ids)
    ? config.recipient_rule_ids.filter((id): id is string => typeof id === "string")
    : [];
  const formatPrompt =
    typeof config.format_prompt === "string" ? config.format_prompt : "";
  const selectedCallExternalToolIds = (() => {
    if (Array.isArray(config.external_tools)) {
      return config.external_tools.filter(
        (id): id is string => typeof id === "string",
      );
    }
    if (Array.isArray(config.tool_ids)) {
      return config.tool_ids.filter((id): id is string => typeof id === "string");
    }
    return [];
  })();
  const llmModel =
    typeof config.llm_model === "string" ? config.llm_model : "gpt-4o-mini";
  const replyAction =
    config.reply_action && typeof config.reply_action === "object"
      ? (config.reply_action as {
          auto_send_min_confidence?: number;
        })
      : {};
  const autoSendMinConfidence =
    typeof replyAction.auto_send_min_confidence === "number"
      ? replyAction.auto_send_min_confidence
      : 0.8;

  const commitConfig = (next: Record<string, unknown>) => {
    if (!isEditable) {
      return;
    }
    onConfigChange(next);
  };

  const readOnlyNote = (text: string) => (
    <p className="text-[12px] text-gray-500 leading-snug">{text}</p>
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-gray-100 px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-[600] text-deep-onyx">Node settings</p>
            <p className="mt-1 text-[12px] font-[500] text-gray-500 capitalize">
              {nodeType.replaceAll("_", " ")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close node settings"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-gray-500 transition-colors hover:bg-gray-100 hover:text-deep-onyx cursor-pointer"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-5">
          {nodeType === "start" &&
            readOnlyNote(
              "System prompt is edited on the email AI agent settings page, not on the canvas.",
            )}

          {nodeType === "load_thread_context" &&
            readOnlyNote(
              "Uses the linked agent Gmail inbox at runtime. Connect an agent to this workflow to set the inbox.",
            )}

          {nodeType === "read_kb" ? (
            <div className="flex flex-col gap-2">
              <p className="text-[13px] font-[500] text-gray-600">
                Knowledge base
              </p>
              {knowledgeItemsList.length === 0 ? (
                readOnlyNote("No knowledge bases found for this team.")
              ) : (
                <AutoComplete
                  items={knowledgeItemsList}
                  value={selectedKnowledgeId}
                  placeholder="Select knowledge..."
                  searchPlaceholder="Search knowledge..."
                  emptyMessage="No knowledge found."
                  onChange={(value) =>
                    commitConfig({ ...config, knowledge_id: value })
                  }
                  clearable={isEditable}
                  className="text-[13px] font-[500]"
                  listMaxHeightClass="max-h-[200px]"
                />
              )}
            </div>
          ) : null}

          {nodeType === "read_tools" ? (
            <div className="flex flex-col gap-2">
              <p className="text-[13px] font-[500] text-gray-600">Tools</p>
              {toolItems.length === 0 ? (
                readOnlyNote("No active tools found.")
              ) : (
                <EmailUserMultiSelect
                  items={toolItems}
                  selectedIds={selectedToolIds}
                  onChange={(toolIds) =>
                    commitConfig({ ...config, tool_ids: toolIds })
                  }
                  placeholder="Select tools..."
                  searchPlaceholder="Search tools..."
                  emptyMessage="No tool found."
                  className="text-[13px] font-[500]"
                />
              )}
            </div>
          ) : null}

          {nodeType === "ai_department_router" ? (
            <div className="flex flex-col gap-2">
              <p className="text-[13px] font-[500] text-gray-600">
                Routing rules
              </p>
              {routingRuleItems.length === 0 ? (
                readOnlyNote("No routing rules found.")
              ) : (
                <EmailUserMultiSelect
                  items={routingRuleItems}
                  selectedIds={selectedRoutingRuleIds}
                  onChange={(ruleIds) =>
                    commitConfig({ ...config, routing_rule_ids: ruleIds })
                  }
                  placeholder="Select routing rules..."
                  searchPlaceholder="Search rules..."
                  emptyMessage="No rule found."
                  className="text-[13px] font-[500]"
                />
              )}
            </div>
          ) : null}

          {nodeType === "ai_recipients_generator" ? (
            <div className="flex flex-col gap-2">
              <p className="text-[13px] font-[500] text-gray-600">
                Recipient rules
              </p>
              {recipientRuleItems.length === 0 ? (
                readOnlyNote("No recipient rules found.")
              ) : (
                <EmailUserMultiSelect
                  items={recipientRuleItems}
                  selectedIds={selectedRecipientRuleIds}
                  onChange={(ruleIds) =>
                    commitConfig({ ...config, recipient_rule_ids: ruleIds })
                  }
                  placeholder="Select recipient rules..."
                  searchPlaceholder="Search rules..."
                  emptyMessage="No rule found."
                  className="text-[13px] font-[500]"
                />
              )}
            </div>
          ) : null}

          {nodeType === "generate_email" ? (
            <>
              <div className="flex flex-col gap-2">
                <p className="text-[13px] font-[500] text-gray-600">
                  LLM model
                </p>
                <AutoComplete
                  items={llmModelItems}
                  value={llmModel}
                  placeholder="Select model..."
                  searchPlaceholder="Search model..."
                  emptyMessage="No model found."
                  onChange={(value) =>
                    commitConfig({ ...config, llm_model: value })
                  }
                  className="text-[13px] font-[500]"
                  listMaxHeightClass="max-h-[200px]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-[13px] font-[500] text-gray-600">
                  Format template
                </p>
                <CustomTextareaPrimary
                  value={formatPrompt}
                  onChange={(event) =>
                    commitConfig({
                      ...config,
                      format_prompt: event.target.value,
                    })
                  }
                  rows={5}
                  readOnly={!isEditable}
                  placeholder={GENERATE_EMAIL_FORMAT_TEMPLATE_PLACEHOLDER}
                  className="min-h-[100px] w-full text-[13px]"
                />
              </div>
            </>
          ) : null}

          {nodeType === "save_gmail_draft" ? (
            <div className="flex flex-col gap-3">
              {readOnlyNote("Always saves the generated reply as a Gmail draft.")}
              {isEditable && onSwapTail ? (
                <button
                  type="button"
                  onClick={() => onSwapTail("send_email")}
                  className="rounded-[10px] border border-gray-200 px-3 py-2 text-left text-[12px] font-[500] text-gray-700 transition-colors hover:border-serene-purple/40 hover:bg-serene-purple/5"
                >
                  Switch to auto-send tail
                </button>
              ) : null}
            </div>
          ) : null}

          {nodeType === "send_email" ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <p className="text-[13px] font-[500] text-gray-600">
                  Auto-send min confidence
                </p>
                <Slider
                  value={[autoSendMinConfidence]}
                  min={0}
                  max={1}
                  step={0.05}
                  disabled={!isEditable}
                  onValueChange={(values) =>
                    commitConfig({
                      ...config,
                      reply_action: {
                        mode: "auto_send",
                        auto_send_min_confidence: values[0] ?? 0.8,
                      },
                    })
                  }
                />
                <p className="text-[12px] text-gray-500">
                  {autoSendMinConfidence.toFixed(2)} — sends when confidence is
                  at or above this threshold, otherwise saves a draft.
                </p>
              </div>
              {isEditable && onSwapTail ? (
                <button
                  type="button"
                  onClick={() => onSwapTail("save_gmail_draft")}
                  className="rounded-[10px] border border-gray-200 px-3 py-2 text-left text-[12px] font-[500] text-gray-700 transition-colors hover:border-serene-purple/40 hover:bg-serene-purple/5"
                >
                  Switch to draft-only tail
                </button>
              ) : null}
            </div>
          ) : null}

          {nodeType === "stop" &&
            readOnlyNote("End of the workflow pipeline.")}

          {nodeType === "call_external_tool" ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-[13px] font-[500] text-gray-600">
                  External tools
                </p>
                {toolItems.length === 0 ? (
                  readOnlyNote("No active tools found.")
                ) : (
                  <EmailUserMultiSelect
                    items={toolItems}
                    selectedIds={selectedCallExternalToolIds}
                    onChange={(toolIds) => {
                      const next: Record<string, unknown> = {
                        ...config,
                        external_tools: toolIds,
                      };
                      delete next.tool_ids;
                      commitConfig(next);
                    }}
                    placeholder="Select external tools..."
                    searchPlaceholder="Search tools..."
                    emptyMessage="No tool found."
                    className="text-[13px] font-[500]"
                  />
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {isEditable && onDelete ? (
        <div className="shrink-0 border-t border-gray-100 p-4">
          <PrimaryButton
            type="button"
            onClick={onDelete}
            className="flex w-full min-h-[40px] items-center justify-center gap-2 bg-danger-red text-[13px] font-[600] hover:bg-danger-red/90"
          >
            <Trash2 size={16} aria-hidden />
            Delete node
          </PrimaryButton>
        </div>
      ) : null}
    </div>
  );
}

export function getSelectedNodeData(
  nodes: Array<{ id: string; data: EmailFlowNodeData; type?: string }>,
  selectedNodeId: string | null,
) {
  if (!selectedNodeId) {
    return null;
  }
  const node = nodes.find((entry) => entry.id === selectedNodeId);
  if (!node) {
    return null;
  }
  return {
    id: node.id,
    type: (node.type ?? node.data.nodeType) as EmailFlowNodeType,
    config: node.data.config ?? {},
  };
}
