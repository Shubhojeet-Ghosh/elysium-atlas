"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bot, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import PrimaryButton from "@/components/ui/PrimaryButton";
import CustomInput from "@/components/inputs/CustomInput";
import AutoComplete from "@/components/ui/AutoComplete";
import Spinner from "@/components/ui/Spinner";
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
import { setEmailDepartments } from "@/store/reducers/emailDepartmentsSlice";
import {
  createEmailAiAgent,
  listTeamEmailAiAgents,
  triggerAgentSync,
  type EmailAiAgent,
} from "@/utils/emailAiAgentsApi";
import {
  listTeamGmailAccounts,
  type GmailAccount,
} from "@/utils/gmailAccountsApi";
import { listTeamDepartments } from "@/utils/emailDepartmentsApi";
import { formatDateTime12hr } from "@/utils/formatDate";
import { emailConfig } from "@/lib/emailConfig";

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
  const departmentsTeamID = useAppSelector(
    (state) => state.emailDepartments.teamID,
  );
  const departmentsLoaded = useAppSelector(
    (state) => state.emailDepartments.isLoaded,
  );
  const [agents, setAgents] = useState<EmailAiAgent[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [selectedInboxId, setSelectedInboxId] = useState("");
  const [teamInboxes, setTeamInboxes] = useState<GmailAccount[]>([]);
  const [isLoadingInboxes, setIsLoadingInboxes] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
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

  const fetchTeamInboxes = useCallback(async () => {
    if (!teamID) {
      setTeamInboxes([]);
      return;
    }

    setIsLoadingInboxes(true);
    try {
      const data = await listTeamGmailAccounts(teamID);
      if (data.success && Array.isArray(data.accounts)) {
        setTeamInboxes(data.accounts);
      } else {
        setTeamInboxes([]);
      }
    } catch {
      setTeamInboxes([]);
    } finally {
      setIsLoadingInboxes(false);
    }
  }, [teamID]);

  const fetchTeamDepartments = useCallback(async () => {
    if (!teamID) {
      return;
    }

    if (departmentsLoaded && departmentsTeamID === teamID) {
      return;
    }

    try {
      const data = await listTeamDepartments(teamID);
      if (data.success && Array.isArray(data.departments)) {
        dispatch(
          setEmailDepartments({
            teamID,
            departments: data.departments,
          }),
        );
      }
    } catch {
      // Leave existing Redux data unchanged on fetch failure.
    }
  }, [teamID, departmentsLoaded, departmentsTeamID, dispatch]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    fetchTeamDepartments();
  }, [fetchTeamDepartments]);

  const handleOpenCreateSheet = () => {
    setAgentName("");
    setSelectedInboxId("");
    setIsCreateSheetOpen(true);
    fetchTeamInboxes();
  };

  const handleCreateAgent = async () => {
    if (!agentName.trim()) {
      toast.error("Please enter an agent name.", { position: "top-center" });
      return;
    }

    if (!selectedInboxId) {
      toast.error("Please select a Gmail inbox.", { position: "top-center" });
      return;
    }

    setIsCreating(true);
    try {
      const data = await createEmailAiAgent(agentName, selectedInboxId);

      if (data.success) {
        setIsCreateSheetOpen(false);
        setAgentName("");
        setSelectedInboxId("");
        await fetchAgents();
        toast.success(data.message || "Email AI agent created successfully.", {
          position: "top-center",
        });
      } else {
        toast.error(data.message || "Failed to create email AI agent.", {
          position: "top-center",
        });
      }
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(
          error,
          "Failed to create email AI agent. Please try again.",
        ),
        { position: "top-center" },
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleTriggerSync = async (
    agent: EmailAiAgent,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();

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
      toast.error(
        getApiErrorMessage(error, "Failed to start inbox sync."),
        { position: "top-center" },
      );
      await fetchAgents();
    } finally {
      setSyncingAgentId(null);
    }
  };

  const handleSheetOpenChange = (open: boolean) => {
    setIsCreateSheetOpen(open);
    if (!open) {
      setIsCreating(false);
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
                            className="border-b border-gray-100 hover:bg-serene-purple/10 hover:text-serene-purple transition-all duration-200"
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
                            <TableCell className="py-4 px-[10px] text-center">
                              <div className="flex items-center justify-center">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={(event) =>
                                        handleTriggerSync(agent, event)
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

      <Sheet open={isCreateSheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:w-[340px] sm:max-w-[90vw] z-[110] px-[4px] flex flex-col"
        >
          <SheetHeader>
            <SheetTitle>
              <div className="flex items-center justify-start">
                <Bot className="inline mr-2" size={18} />
                <p>Create Email Agent</p>
              </div>
            </SheetTitle>
            <SheetDescription>
              Link an agent name to a connected Gmail inbox.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 px-4 flex flex-col gap-6 flex-1">
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
                />
              )}
            </div>
          </div>

          <div className="px-4 pb-4 mt-auto">
            <PrimaryButton
              onClick={handleCreateAgent}
              disabled={
                isCreating ||
                !agentName.trim() ||
                !selectedInboxId ||
                teamInboxes.length === 0
              }
              className="w-full font-[600] flex items-center justify-center gap-2 min-h-[40px] text-[13px]"
            >
              {isCreating ? (
                <Spinner className="border-white" />
              ) : (
                <span>Create agent</span>
              )}
            </PrimaryButton>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
