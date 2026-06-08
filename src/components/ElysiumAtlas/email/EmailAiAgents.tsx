"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bot, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import PrimaryButton from "@/components/ui/PrimaryButton";
import CustomInput from "@/components/inputs/CustomInput";
import CustomTextareaPrimary from "@/components/inputs/CustomTextareaPrimary";
import AutoComplete from "@/components/ui/AutoComplete";
import Spinner from "@/components/ui/Spinner";
import EmailUserMultiSelect from "@/components/ElysiumAtlas/email/EmailUserMultiSelect";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppDispatch, useAppSelector } from "@/store";
import { setEmailKnowledge } from "@/store/reducers/emailKnowledgeSlice";
import { setEmailTools } from "@/store/reducers/emailToolsSlice";
import { setEmailRules } from "@/store/reducers/emailRulesSlice";
import { setEmailDepartments } from "@/store/reducers/emailDepartmentsSlice";
import { setEmailFlows } from "@/store/reducers/emailFlowsSlice";
import {
  createEmailAiAgent,
  getEmailAiAgent,
  listTeamEmailAiAgents,
  triggerAgentSync,
  updateEmailAiAgent,
  DEFAULT_REPLY_ACTION,
  type EmailAiAgent,
  type EmailReplyAction,
  type EmailReplyActionMode,
} from "@/utils/emailAiAgentsApi";
import {
  listTeamGmailAccounts,
  type GmailAccount,
} from "@/utils/gmailAccountsApi";
import { listTeamKnowledge } from "@/utils/emailKnowledgeApi";
import { listTeamTools } from "@/utils/emailToolDefinitionsApi";
import { listTeamEmailRoutingRules } from "@/utils/emailRoutingRulesApi";
import { listTeamEmailRecipientRules } from "@/utils/emailRecipientRulesApi";
import { listTeamDepartments } from "@/utils/emailDepartmentsApi";
import { listTeamEmailFlows } from "@/utils/emailFlowsApi";
import { fetchTeamEmailFlowsForStore } from "@/utils/fetchTeamEmailFlowsStore";
import { formatDateTime12hr } from "@/utils/formatDate";
import { emailConfig } from "@/lib/emailConfig";
import { AVAILABLE_MODELS } from "@/lib/llmConfig";
import EmailAgentReplyAction from "@/components/ElysiumAtlas/email/EmailAgentReplyAction";

const DEFAULT_LLM_MODEL = AVAILABLE_MODELS[0]?.model_code ?? "gpt-4o-mini";
const MAX_ATTACHED_RULES = 50;
const MAX_EMAIL_FORMAT_TEMPLATE_LENGTH = 10000;
const RECIPIENT_RULE_LABEL_LENGTH = 60;

function truncateRuleLabel(
  text: string,
  maxLength = RECIPIENT_RULE_LABEL_LENGTH,
) {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength).trim()}…`;
}

type AgentSheetMode = "create" | "edit";

function resolveFlowIdForSave(
  mode: AgentSheetMode,
  selectedFlowId: string,
  originalFlowId: string | null,
): string | undefined {
  const trimmed = selectedFlowId.trim();
  if (mode === "create") {
    return trimmed || undefined;
  }
  if (trimmed && trimmed !== (originalFlowId ?? "")) {
    return trimmed;
  }
  return undefined;
}

function resetAgentFormState(setters: {
  setAgentName: (value: string) => void;
  setSystemPrompt: (value: string) => void;
  setEmailFormatTemplate: (value: string) => void;
  setLlmModel: (value: string) => void;
  setSelectedKnowledgeId: (value: string) => void;
  setSelectedToolIds: (value: string[]) => void;
  setSelectedInboxId: (value: string) => void;
  setSelectedFlowId: (value: string) => void;
  setReplyActionMode: (value: EmailReplyActionMode) => void;
  setAutoSendMinConfidence: (value: number) => void;
  setSelectedRoutingRuleIds: (value: string[]) => void;
  setSelectedRecipientRuleIds: (value: string[]) => void;
}) {
  setters.setAgentName("");
  setters.setSystemPrompt("");
  setters.setEmailFormatTemplate("");
  setters.setLlmModel(DEFAULT_LLM_MODEL);
  setters.setSelectedKnowledgeId("");
  setters.setSelectedToolIds([]);
  setters.setSelectedInboxId("");
  setters.setSelectedFlowId("");
  setters.setReplyActionMode(DEFAULT_REPLY_ACTION.mode);
  setters.setAutoSendMinConfidence(
    DEFAULT_REPLY_ACTION.auto_send_min_confidence,
  );
  setters.setSelectedRoutingRuleIds([]);
  setters.setSelectedRecipientRuleIds([]);
}

function populateAgentFormFromDetails(
  agent: EmailAiAgent,
  setters: {
    setAgentName: (value: string) => void;
    setSystemPrompt: (value: string) => void;
    setEmailFormatTemplate: (value: string) => void;
    setLlmModel: (value: string) => void;
    setSelectedKnowledgeId: (value: string) => void;
    setSelectedToolIds: (value: string[]) => void;
    setSelectedInboxId: (value: string) => void;
    setSelectedFlowId: (value: string) => void;
    setReplyActionMode: (value: EmailReplyActionMode) => void;
    setAutoSendMinConfidence: (value: number) => void;
    setSelectedRoutingRuleIds: (value: string[]) => void;
    setSelectedRecipientRuleIds: (value: string[]) => void;
  },
) {
  setters.setAgentName(agent.name || "");
  setters.setSelectedInboxId(agent.gmail_account_id || "");
  setters.setSelectedFlowId(agent.flow_id || "");
  setters.setLlmModel(agent.llm_model || DEFAULT_LLM_MODEL);
  setters.setSystemPrompt(agent.system_prompt || "");
  setters.setEmailFormatTemplate(agent.email_format_template || "");
  setters.setSelectedKnowledgeId(agent.knowledge_id || "");
  setters.setSelectedToolIds(agent.tool_ids || []);
  setters.setReplyActionMode(
    agent.reply_action?.mode ?? DEFAULT_REPLY_ACTION.mode,
  );
  setters.setAutoSendMinConfidence(
    agent.reply_action?.auto_send_min_confidence ??
      DEFAULT_REPLY_ACTION.auto_send_min_confidence,
  );
  setters.setSelectedRoutingRuleIds(agent.routing_rule_ids || []);
  setters.setSelectedRecipientRuleIds(agent.recipient_rule_ids || []);
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

export default function EmailAiAgents() {
  const dispatch = useAppDispatch();
  const teamID = useAppSelector((state) => state.emailUser.teamID);
  const knowledgeItems = useAppSelector(
    (state) => state.emailKnowledge.knowledgeItems,
  );
  const teamTools = useAppSelector((state) => state.emailTools.tools);
  const routingRules = useAppSelector((state) => state.rules.routingRules);
  const recipientRules = useAppSelector((state) => state.rules.recipientRules);
  const teamFlows = useAppSelector((state) => state.emailFlows.flows);
  const [agents, setAgents] = useState<EmailAiAgent[]>([]);
  const [isLoadingFormData, setIsLoadingFormData] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [isAgentSheetOpen, setIsAgentSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<AgentSheetMode>("create");
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [isLoadingAgentDetails, setIsLoadingAgentDetails] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [emailFormatTemplate, setEmailFormatTemplate] = useState("");
  const [llmModel, setLlmModel] = useState(DEFAULT_LLM_MODEL);
  const [selectedKnowledgeId, setSelectedKnowledgeId] = useState("");
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);
  const [selectedInboxId, setSelectedInboxId] = useState("");
  const [selectedFlowId, setSelectedFlowId] = useState("");
  const [originalFlowId, setOriginalFlowId] = useState<string | null>(null);
  const [replyActionMode, setReplyActionMode] = useState<EmailReplyActionMode>(
    DEFAULT_REPLY_ACTION.mode,
  );
  const [autoSendMinConfidence, setAutoSendMinConfidence] = useState(
    DEFAULT_REPLY_ACTION.auto_send_min_confidence,
  );
  const [selectedRoutingRuleIds, setSelectedRoutingRuleIds] = useState<
    string[]
  >([]);
  const [selectedRecipientRuleIds, setSelectedRecipientRuleIds] = useState<
    string[]
  >([]);
  const [teamInboxes, setTeamInboxes] = useState<GmailAccount[]>([]);
  const [isLoadingInboxes, setIsLoadingInboxes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [syncingAgentId, setSyncingAgentId] = useState<string | null>(null);

  const inboxItems = useMemo(
    () =>
      teamInboxes.map((inbox) => ({
        value: inbox.account_id,
        label: `${inbox.inbox_name} (${inbox.email_address})`,
        selectedLabel: inbox.inbox_name,
        icon: emailConfig.googleIcon,
      })),
    [teamInboxes],
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

  const knowledgeAutoCompleteItems = useMemo(() => {
    const items = knowledgeItems.map((item) => ({
      value: item.knowledge_id,
      label: item.title,
    }));

    if (
      selectedKnowledgeId &&
      !items.some((item) => item.value === selectedKnowledgeId)
    ) {
      items.unshift({
        value: selectedKnowledgeId,
        label: selectedKnowledgeId,
      });
    }

    return items;
  }, [knowledgeItems, selectedKnowledgeId]);

  const activeTeamTools = useMemo(
    () => teamTools.filter((tool) => tool.status === "active" || !tool.status),
    [teamTools],
  );

  const toolAutoCompleteItems = useMemo(() => {
    const items = activeTeamTools.map((tool) => ({
      value: tool.tool_id,
      label: tool.display_name,
    }));

    selectedToolIds.forEach((toolId) => {
      if (!items.some((item) => item.value === toolId)) {
        const currentTool = teamTools.find((tool) => tool.tool_id === toolId);
        items.unshift({
          value: toolId,
          label: currentTool?.display_name || toolId,
        });
      }
    });

    return items;
  }, [activeTeamTools, teamTools, selectedToolIds]);

  const routingRuleAutoCompleteItems = useMemo(() => {
    const selectableRules = routingRules.filter(
      (rule) => rule.status === "active" || !rule.status,
    );
    const items = selectableRules.map((rule) => ({
      value: rule.routing_rule_id,
      label: rule.rule_name,
    }));

    selectedRoutingRuleIds.forEach((ruleId) => {
      if (!items.some((item) => item.value === ruleId)) {
        const rule = routingRules.find(
          (entry) => entry.routing_rule_id === ruleId,
        );
        items.unshift({
          value: ruleId,
          label: rule?.rule_name || ruleId,
        });
      }
    });

    return items;
  }, [routingRules, selectedRoutingRuleIds]);

  const recipientRuleAutoCompleteItems = useMemo(() => {
    const items = recipientRules.map((rule) => ({
      value: rule.recipient_rule_id,
      label:
        rule.rule_name?.trim() ||
        truncateRuleLabel(rule.recipient_prompt) ||
        rule.recipient_rule_id,
    }));

    selectedRecipientRuleIds.forEach((ruleId) => {
      if (!items.some((item) => item.value === ruleId)) {
        const rule = recipientRules.find(
          (entry) => entry.recipient_rule_id === ruleId,
        );
        items.unshift({
          value: ruleId,
          label:
            rule?.rule_name?.trim() ||
            (rule ? truncateRuleLabel(rule.recipient_prompt) : ruleId),
        });
      }
    });

    return items;
  }, [recipientRules, selectedRecipientRuleIds]);

  const workflowAutoCompleteItems = useMemo(() => {
    const items = teamFlows
      .filter((flow) => {
        if (!flow.is_attached || !flow.attached_agent_id?.trim()) {
          return true;
        }
        if (
          sheetMode === "edit" &&
          editingAgentId &&
          flow.attached_agent_id === editingAgentId
        ) {
          return true;
        }
        return false;
      })
      .map((flow) => ({
        value: flow.flow_id,
        label: flow.summary ? `${flow.name} — ${flow.summary}` : flow.name,
        selectedLabel: flow.name,
      }));

    if (
      selectedFlowId &&
      !items.some((item) => item.value === selectedFlowId)
    ) {
      const currentFlow = teamFlows.find(
        (flow) => flow.flow_id === selectedFlowId,
      );
      items.unshift({
        value: selectedFlowId,
        label: currentFlow?.name || selectedFlowId,
        selectedLabel: currentFlow?.name || selectedFlowId,
      });
    }

    return items;
  }, [teamFlows, sheetMode, editingAgentId, selectedFlowId]);

  const fetchAgents = useCallback(async () => {
    if (!teamID) {
      setAgents([]);
      setIsLoadingAgents(false);
      return [];
    }

    setIsLoadingAgents(true);
    try {
      const data = await listTeamEmailAiAgents(teamID);
      if (data.success && Array.isArray(data.agents)) {
        setAgents(data.agents);
        return data.agents;
      }
      setAgents([]);
      return [];
    } catch {
      setAgents([]);
      return [];
    } finally {
      setIsLoadingAgents(false);
    }
  }, [teamID]);

  const fetchAgentFormData = useCallback(async () => {
    if (!teamID) {
      setTeamInboxes([]);
      return;
    }

    setIsLoadingFormData(true);
    setIsLoadingInboxes(true);
    try {
      const [
        inboxesData,
        knowledgeData,
        toolsData,
        routingData,
        recipientData,
        departmentsData,
        flowsData,
      ] = await Promise.all([
        listTeamGmailAccounts(teamID),
        listTeamKnowledge(teamID),
        listTeamTools(teamID),
        listTeamEmailRoutingRules(teamID, true),
        listTeamEmailRecipientRules(teamID),
        listTeamDepartments(teamID),
        listTeamEmailFlows(teamID),
      ]);

      if (inboxesData.success && Array.isArray(inboxesData.accounts)) {
        setTeamInboxes(inboxesData.accounts);
      } else {
        setTeamInboxes([]);
      }

      if (
        knowledgeData.success &&
        Array.isArray(knowledgeData.knowledge_items)
      ) {
        dispatch(
          setEmailKnowledge({
            teamID,
            knowledgeItems: knowledgeData.knowledge_items,
          }),
        );
      }

      if (toolsData.success && Array.isArray(toolsData.tools)) {
        dispatch(
          setEmailTools({
            teamID,
            tools: toolsData.tools,
          }),
        );
      }

      dispatch(
        setEmailRules({
          teamID,
          routingRules:
            routingData.success && Array.isArray(routingData.rules)
              ? routingData.rules
              : [],
          recipientRules:
            recipientData.success && Array.isArray(recipientData.rules)
              ? recipientData.rules
              : [],
        }),
      );

      if (
        departmentsData.success &&
        Array.isArray(departmentsData.departments)
      ) {
        dispatch(
          setEmailDepartments({
            teamID,
            departments: departmentsData.departments,
          }),
        );
      }

      if (flowsData.success && Array.isArray(flowsData.data?.flows)) {
        dispatch(
          setEmailFlows({
            teamID,
            flows: flowsData.data.flows,
          }),
        );
      }
    } catch {
      // Leave existing local/Redux data unchanged on fetch failure.
    } finally {
      setIsLoadingFormData(false);
      setIsLoadingInboxes(false);
    }
  }, [teamID, dispatch]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    void fetchAgentFormData();
  }, [fetchAgentFormData]);

  useEffect(() => {
    if (!teamID) {
      return;
    }
    void fetchTeamEmailFlowsForStore(teamID, dispatch);
  }, [teamID, dispatch]);

  const formSetters = {
    setAgentName,
    setSystemPrompt,
    setEmailFormatTemplate,
    setLlmModel,
    setSelectedKnowledgeId,
    setSelectedToolIds,
    setSelectedInboxId,
    setSelectedFlowId,
    setReplyActionMode,
    setAutoSendMinConfidence,
    setSelectedRoutingRuleIds,
    setSelectedRecipientRuleIds,
  };

  const isFormValid =
    agentName.trim() &&
    systemPrompt.trim() &&
    llmModel &&
    selectedInboxId &&
    teamInboxes.length > 0;

  const handleOpenCreateSheet = () => {
    resetAgentFormState(formSetters);
    setOriginalFlowId(null);
    setSheetMode("create");
    setEditingAgentId(null);
    setIsLoadingAgentDetails(false);
    setIsAgentSheetOpen(true);
    void fetchAgentFormData();
  };

  const handleOpenEditSheet = async (agentId: string) => {
    resetAgentFormState(formSetters);
    setOriginalFlowId(null);
    setSheetMode("edit");
    setEditingAgentId(agentId);
    setIsAgentSheetOpen(true);
    setIsLoadingAgentDetails(true);
    void fetchAgentFormData();

    try {
      const data = await getEmailAiAgent(agentId);

      if (data.success && data.agent) {
        populateAgentFormFromDetails(data.agent, formSetters);
        setOriginalFlowId(data.agent.flow_id || null);
      } else {
        toast.error(data.message || "Failed to load email AI agent.", {
          position: "top-center",
        });
        setIsAgentSheetOpen(false);
        setEditingAgentId(null);
      }
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to load email AI agent."), {
        position: "top-center",
      });
      setIsAgentSheetOpen(false);
      setEditingAgentId(null);
    } finally {
      setIsLoadingAgentDetails(false);
    }
  };

  const handleSaveAgent = async () => {
    if (!agentName.trim()) {
      toast.error("Please enter an agent name.", { position: "top-center" });
      return;
    }

    if (!selectedInboxId) {
      toast.error("Please select a Gmail inbox.", { position: "top-center" });
      return;
    }

    if (!systemPrompt.trim()) {
      toast.error("Please enter a system prompt.", { position: "top-center" });
      return;
    }

    if (emailFormatTemplate.length > MAX_EMAIL_FORMAT_TEMPLATE_LENGTH) {
      toast.error(
        `Email format template must be ${MAX_EMAIL_FORMAT_TEMPLATE_LENGTH} characters or fewer.`,
        { position: "top-center" },
      );
      return;
    }

    if (!llmModel) {
      toast.error("Please select an LLM model.", { position: "top-center" });
      return;
    }

    if (selectedRoutingRuleIds.length > MAX_ATTACHED_RULES) {
      toast.error(
        `You can attach up to ${MAX_ATTACHED_RULES} smart routing setups.`,
        {
          position: "top-center",
        },
      );
      return;
    }

    if (selectedRecipientRuleIds.length > MAX_ATTACHED_RULES) {
      toast.error(
        `You can attach up to ${MAX_ATTACHED_RULES} smart recipient setups.`,
        {
          position: "top-center",
        },
      );
      return;
    }

    setIsSaving(true);
    try {
      const replyAction: EmailReplyAction = {
        mode: replyActionMode,
        auto_send_min_confidence: autoSendMinConfidence,
      };

      const flowIdForSave = resolveFlowIdForSave(
        sheetMode,
        selectedFlowId,
        originalFlowId,
      );

      const data =
        sheetMode === "edit" && editingAgentId
          ? await updateEmailAiAgent(
              editingAgentId,
              agentName,
              selectedInboxId,
              systemPrompt,
              llmModel,
              selectedKnowledgeId,
              selectedToolIds,
              replyAction,
              selectedRoutingRuleIds,
              selectedRecipientRuleIds,
              emailFormatTemplate,
              flowIdForSave,
            )
          : await createEmailAiAgent(
              agentName,
              selectedInboxId,
              systemPrompt,
              llmModel,
              selectedKnowledgeId,
              selectedToolIds,
              replyAction,
              selectedRoutingRuleIds,
              selectedRecipientRuleIds,
              emailFormatTemplate,
              flowIdForSave,
            );

      if (data.success) {
        const wasEdit = sheetMode === "edit";
        setIsAgentSheetOpen(false);
        resetAgentFormState(formSetters);
        setEditingAgentId(null);
        setOriginalFlowId(null);
        setSheetMode("create");
        await Promise.all([
          fetchAgents(),
          fetchTeamEmailFlowsForStore(teamID, dispatch),
        ]);
        const flowSyncedMessage =
          data.flow_synced === true
            ? " Linked workflow graph was updated."
            : "";
        toast.success(
          (data.message ||
            (wasEdit
              ? "Email AI agent updated successfully."
              : "Email AI agent created successfully.")) + flowSyncedMessage,
          { position: "top-center" },
        );
      } else {
        toast.error(
          data.message ||
            (sheetMode === "edit"
              ? "Failed to update email AI agent."
              : "Failed to create email AI agent."),
          { position: "top-center" },
        );
      }
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(
          error,
          sheetMode === "edit"
            ? "Failed to update email AI agent. Please try again."
            : "Failed to create email AI agent. Please try again.",
        ),
        { position: "top-center" },
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerSync = async (
    agent: EmailAiAgent,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();
    event.preventDefault();

    if (syncingAgentId) {
      return;
    }

    setSyncingAgentId(agent.agent_id);
    try {
      const data = await triggerAgentSync(agent.agent_id);

      if (!data.success) {
        toast.error(data.message || "Failed to start inbox sync.", {
          position: "top-center",
        });
        return;
      }

      toast.success(data.message || "Inbox sync started.", {
        position: "top-center",
      });
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to start inbox sync."), {
        position: "top-center",
      });
      await fetchAgents();
    } finally {
      setSyncingAgentId(null);
    }
  };

  const handleSheetOpenChange = (open: boolean) => {
    setIsAgentSheetOpen(open);
    if (!open) {
      setIsSaving(false);
      setIsLoadingAgentDetails(false);
      setEditingAgentId(null);
      setOriginalFlowId(null);
      resetAgentFormState(formSetters);
      setSheetMode("create");
    }
  };

  const isAgentSyncing = (agent: EmailAiAgent) =>
    syncingAgentId === agent.agent_id;

  return (
    <>
      <div className="w-full h-full">
        <div className="flex flex-col">
          <div className="lg:text-[22px] text-[18px] font-bold flex justify-between items-center">
            <div>AI Agents</div>
            <PrimaryButton
              onClick={handleOpenCreateSheet}
              className="font-[600] flex items-center justify-center gap-2 min-w-[100px] min-h-[40px] text-[13px]"
            >
              <Plus size={16} className="-ml-1" />
              <span>Create Email Agent</span>
            </PrimaryButton>
          </div>

          <div className="w-full mt-[24px] overflow-hidden">
            <div className="relative">
              <div className="overflow-x-auto md:overflow-visible">
                <div className="inline-block min-w-full align-middle">
                  <Table className="min-w-[800px] lg:min-w-full">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[180px] lg:w-[220px] font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                          Agent Name
                        </TableHead>
                        <TableHead className="min-w-[160px] font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                          Inbox Name
                        </TableHead>
                        <TableHead className="min-w-[200px] lg:min-w-[240px] font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                          Email
                        </TableHead>
                        <TableHead className="min-w-[180px] pl-4 md:pl-8 lg:pl-12 font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                          Created
                        </TableHead>
                        <TableHead className="w-[80px] font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap text-center">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingAgents ? (
                        <TableRow className="hover:bg-transparent">
                          <TableCell
                            colSpan={5}
                            className="py-8 text-center text-[13px] text-gray-500"
                          >
                            Loading agents...
                          </TableCell>
                        </TableRow>
                      ) : agents.length === 0 ? (
                        <TableRow className="hover:bg-transparent">
                          <TableCell
                            colSpan={5}
                            className="py-8 text-center text-[13px] text-gray-500"
                          >
                            No email AI agents configured yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        agents.map((agent) => (
                          <TableRow
                            key={agent.agent_id}
                            onClick={() => handleOpenEditSheet(agent.agent_id)}
                            className="border-b border-gray-100 hover:bg-serene-purple/10 hover:text-serene-purple transition-all duration-200 cursor-pointer"
                          >
                            <TableCell className="font-medium py-4 px-[10px] text-[14px] whitespace-nowrap text-deep-onyx">
                              {agent.name}
                            </TableCell>
                            <TableCell className="py-4 px-[10px] text-[14px] whitespace-nowrap text-deep-onyx">
                              {agent.inbox_name || "—"}
                            </TableCell>
                            <TableCell className="py-4 px-[10px] text-[14px] whitespace-nowrap text-deep-onyx">
                              {agent.email_address || "—"}
                            </TableCell>
                            <TableCell className="py-4 px-[10px] pl-4 md:pl-8 lg:pl-12 text-[14px] whitespace-nowrap text-deep-onyx">
                              {agent.created_at
                                ? formatDateTime12hr(agent.created_at)
                                : "—"}
                            </TableCell>
                            <TableCell
                              className="py-4 px-[10px] text-center"
                              onClick={(event) => event.stopPropagation()}
                              onPointerDown={(event) => event.stopPropagation()}
                            >
                              <div
                                className="flex items-center justify-center"
                                onClick={(event) => event.stopPropagation()}
                                onPointerDown={(event) =>
                                  event.stopPropagation()
                                }
                              >
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        void handleTriggerSync(agent, event);
                                      }}
                                      onPointerDown={(event) =>
                                        event.stopPropagation()
                                      }
                                      disabled={isAgentSyncing(agent)}
                                      aria-label="Sync inbox"
                                      className="flex items-center justify-center h-[30px] w-[30px] rounded-full hover:bg-serene-purple/10 transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {isAgentSyncing(agent) ? (
                                        <Spinner className="border-serene-purple h-4 w-4" />
                                      ) : (
                                        <RotateCcw
                                          size={18}
                                          className="text-serene-purple"
                                        />
                                      )}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="left">
                                    Sync inbox
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Sheet open={isAgentSheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:w-[340px] sm:max-w-[90vw] z-[110] px-[4px] flex flex-col h-full max-h-screen overflow-hidden gap-0"
        >
          <SheetHeader className="shrink-0 px-4 pb-2">
            <SheetTitle>
              <div className="flex items-center justify-start">
                <Bot className="inline mr-2" size={18} />
                <p>
                  {sheetMode === "edit"
                    ? "Edit Email Agent"
                    : "Create Email Agent"}
                </p>
              </div>
            </SheetTitle>
            <SheetDescription>
              {sheetMode === "edit"
                ? "View and update this agent's configuration."
                : "Link an agent name to a connected Gmail inbox and define how it should respond."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
            {isLoadingAgentDetails ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <Spinner className="border-gray-700" />
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-[8px]">
                  <p className="text-[14px] font-[500] ml-[2px] text-gray-600">
                    Agent Name
                  </p>
                  <CustomInput
                    type="text"
                    placeholder="Enter agent name"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="mt-[2px] min-h-[40px] w-full"
                  />
                </div>

                <div className="flex flex-col gap-[8px]">
                  <p className="text-[14px] font-[500] ml-[2px] text-gray-600">
                    Gmail Inbox
                  </p>
                  {isLoadingInboxes ? (
                    <div className="flex items-center justify-center min-h-[40px]">
                      <Spinner className="border-gray-700" />
                    </div>
                  ) : teamInboxes.length === 0 ? (
                    <p className="text-[12px] text-gray-500">
                      No Gmail inboxes found. Connect an inbox on the Inbox page
                      first.
                    </p>
                  ) : (
                    <AutoComplete
                      items={inboxItems}
                      value={selectedInboxId}
                      placeholder="Select a Gmail inbox..."
                      searchPlaceholder="Search inbox..."
                      emptyMessage="No inbox found."
                      onChange={(value) => setSelectedInboxId(value)}
                      className="text-[13px] font-[500]"
                      listMaxHeightClass="max-h-[200px]"
                    />
                  )}
                </div>

                <div className="flex flex-col gap-[8px]">
                  <p className="text-[14px] font-[500] ml-[2px] text-gray-600">
                    LLM Model
                  </p>
                  <AutoComplete
                    items={llmModelItems}
                    value={llmModel}
                    placeholder="Select LLM model..."
                    searchPlaceholder="Search model..."
                    emptyMessage="No model found."
                    onChange={(value) => setLlmModel(value)}
                    className="text-[13px] font-[500]"
                    listMaxHeightClass="max-h-[200px]"
                  />
                </div>

                <div className="flex flex-col gap-[8px]">
                  <p className="text-[14px] font-[500] ml-[2px] text-gray-600">
                    System Prompt
                  </p>
                  <CustomTextareaPrimary
                    placeholder="Enter your system prompt here..."
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    rows={6}
                    resizable={true}
                    className="mt-[2px] min-h-[120px] w-full"
                  />
                </div>

                <div className="flex flex-col gap-[8px]">
                  <p className="text-[14px] font-[500] ml-[2px] text-gray-600">
                    Email Format Template
                  </p>
                  <p className="text-[12px] text-gray-500 ml-[2px]">
                    Optional. Describe how reply emails should be structured —
                    tone, greeting, body layout, and sign-off.
                  </p>
                  <CustomTextareaPrimary
                    placeholder={`Use a professional tone.

Greeting: Hi {customer_name},

Body: 2-3 short paragraphs answering the question.

Closing:
Best regards,
Support Team`}
                    value={emailFormatTemplate}
                    onChange={(e) => setEmailFormatTemplate(e.target.value)}
                    rows={6}
                    resizable={true}
                    className="mt-[2px] min-h-[120px] w-full"
                  />
                </div>

                <div className="flex flex-col gap-[8px]">
                  <p className="text-[14px] font-[500] ml-[2px] text-gray-600">
                    Knowledge Base
                  </p>
                  <p className="text-[12px] text-gray-500 ml-[2px]">
                    Optional. Select a knowledge base for RAG, or leave empty.
                  </p>
                  {isLoadingFormData ? (
                    <div className="flex items-center justify-center min-h-[40px]">
                      <Spinner className="border-gray-700" />
                    </div>
                  ) : knowledgeAutoCompleteItems.length === 0 ? (
                    <p className="text-[12px] text-gray-500">
                      No knowledge bases found. You can still save the agent
                      without one.
                    </p>
                  ) : (
                    <AutoComplete
                      items={knowledgeAutoCompleteItems}
                      value={selectedKnowledgeId}
                      placeholder="Select a knowledge base (optional)..."
                      searchPlaceholder="Search knowledge..."
                      emptyMessage="No knowledge found."
                      onChange={(value) => setSelectedKnowledgeId(value)}
                      clearable
                      className="text-[13px] font-[500]"
                      listMaxHeightClass="max-h-[200px]"
                    />
                  )}
                </div>

                <div className="flex flex-col gap-[8px]">
                  <p className="text-[14px] font-[500] ml-[2px] text-gray-600">
                    Tools
                  </p>
                  <p className="text-[12px] text-gray-500 ml-[2px]">
                    Optional. Select tools the agent can call.
                  </p>
                  {isLoadingFormData ? (
                    <div className="flex items-center justify-center min-h-[40px]">
                      <Spinner className="border-gray-700" />
                    </div>
                  ) : toolAutoCompleteItems.length === 0 ? (
                    <p className="text-[12px] text-gray-500">
                      No active tools found. You can still save the agent
                      without tools.
                    </p>
                  ) : (
                    <EmailUserMultiSelect
                      items={toolAutoCompleteItems}
                      selectedIds={selectedToolIds}
                      onChange={setSelectedToolIds}
                      placeholder="Select tools (optional)..."
                      searchPlaceholder="Search tools..."
                      emptyMessage="No tool found."
                      className="text-[13px] font-[500]"
                    />
                  )}
                </div>

                <div className="flex flex-col gap-[8px]">
                  <p className="text-[14px] font-[500] ml-[2px] text-gray-600">
                    Smart Routing
                  </p>
                  <p className="text-[12px] text-gray-500 ml-[2px]">
                    Choose when the AI should route emails to each department.
                  </p>
                  {isLoadingFormData ? (
                    <div className="flex items-center justify-center min-h-[40px]">
                      <Spinner className="border-gray-700" />
                    </div>
                  ) : routingRuleAutoCompleteItems.length === 0 ? (
                    <p className="text-[12px] text-gray-500">
                      Nothing set up yet. Add smart routing on the Smart Routing
                      page first.
                    </p>
                  ) : (
                    <EmailUserMultiSelect
                      items={routingRuleAutoCompleteItems}
                      selectedIds={selectedRoutingRuleIds}
                      onChange={setSelectedRoutingRuleIds}
                      placeholder="Select smart routing..."
                      searchPlaceholder="Search smart routing..."
                      emptyMessage="No match found."
                      className="text-[13px] font-[500]"
                    />
                  )}
                </div>

                <div className="flex flex-col gap-[8px]">
                  <p className="text-[14px] font-[500] ml-[2px] text-gray-600">
                    Smart Recipients
                  </p>
                  <p className="text-[12px] text-gray-500 ml-[2px]">
                    Choose when the AI should add people to CC or BCC on
                    replies.
                  </p>
                  {isLoadingFormData ? (
                    <div className="flex items-center justify-center min-h-[40px]">
                      <Spinner className="border-gray-700" />
                    </div>
                  ) : recipientRuleAutoCompleteItems.length === 0 ? (
                    <p className="text-[12px] text-gray-500">
                      Nothing set up yet. Add smart recipients on the Smart
                      Recipients page first.
                    </p>
                  ) : (
                    <EmailUserMultiSelect
                      items={recipientRuleAutoCompleteItems}
                      selectedIds={selectedRecipientRuleIds}
                      onChange={setSelectedRecipientRuleIds}
                      placeholder="Select smart recipients..."
                      searchPlaceholder="Search smart recipients..."
                      emptyMessage="No match found."
                      className="text-[13px] font-[500]"
                    />
                  )}
                </div>

                <EmailAgentReplyAction
                  mode={replyActionMode}
                  autoSendMinConfidence={autoSendMinConfidence}
                  onModeChange={setReplyActionMode}
                  onConfidenceChange={setAutoSendMinConfidence}
                />

                <div className="flex flex-col gap-[8px]">
                  <p className="text-[14px] font-[500] ml-[2px] text-gray-600">
                    Workflow
                  </p>
                  <p className="text-[12px] text-gray-500 ml-[2px]">
                    Optional. Leave empty on create to auto-generate a default
                    workflow. On edit, pick an unattached workflow to switch
                    links.
                  </p>
                  {isLoadingFormData ? (
                    <div className="flex items-center justify-center min-h-[40px]">
                      <Spinner className="border-gray-700" />
                    </div>
                  ) : workflowAutoCompleteItems.length === 0 ? (
                    <p className="text-[12px] text-gray-500">
                      {sheetMode === "edit" && originalFlowId
                        ? "This agent keeps its current linked workflow."
                        : "No unattached workflows available. A default workflow will be created on save."}
                    </p>
                  ) : (
                    <AutoComplete
                      items={workflowAutoCompleteItems}
                      value={selectedFlowId}
                      placeholder={
                        sheetMode === "edit"
                          ? "Keep current workflow..."
                          : "Auto-create default workflow..."
                      }
                      searchPlaceholder="Search workflows..."
                      emptyMessage="No workflow found."
                      onChange={(value) => setSelectedFlowId(value)}
                      clearable
                      className="text-[13px] font-[500]"
                      listMaxHeightClass="max-h-[200px]"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-gray-100 px-4 py-4 bg-background">
            <PrimaryButton
              onClick={handleSaveAgent}
              disabled={isSaving || isLoadingAgentDetails || !isFormValid}
              className="w-full font-[600] flex items-center justify-center gap-2 min-h-[40px] text-[13px]"
            >
              {isSaving ? (
                <Spinner className="border-white" />
              ) : (
                <span>
                  {sheetMode === "edit" ? "Update agent" : "Create agent"}
                </span>
              )}
            </PrimaryButton>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
