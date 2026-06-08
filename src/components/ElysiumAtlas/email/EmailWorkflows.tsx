"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Workflow } from "lucide-react";
import { toast } from "sonner";
import EmailWorkflowBuilder from "@/components/ElysiumAtlas/email/workflow/EmailWorkflowBuilder";
import CustomInput from "@/components/inputs/CustomInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Spinner from "@/components/ui/Spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppDispatch, useAppSelector } from "@/store";
import { setLeftNavOpen } from "@/store/reducers/settingsSlice";
import { createEmailFlow, type EmailFlowDetail } from "@/utils/emailFlowsApi";
import { fetchEmailWorkflowEditorData } from "@/utils/fetchEmailWorkflowEditorData";
import { fetchTeamEmailFlowsForStore } from "@/utils/fetchTeamEmailFlowsStore";
import { formatDateTime12hr } from "@/utils/formatDate";

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

export default function EmailWorkflows() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const teamID = useAppSelector((state) => state.emailUser.teamID);
  const flows = useAppSelector((state) => state.emailFlows.flows);
  const isLeftNavOpen = useAppSelector((state) => state.settings.isLeftNavOpen);
  const selectedFlowId = searchParams.get("flow_id");
  const isCanvasView = Boolean(selectedFlowId);

  const [isLoadingFlows, setIsLoadingFlows] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false);
  const [createdFlow, setCreatedFlow] = useState<EmailFlowDetail | null>(null);
  const isLeftNavOpenRef = useRef(isLeftNavOpen);
  isLeftNavOpenRef.current = isLeftNavOpen;

  const closeBuilder = useCallback(() => {
    setCreatedFlow(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("flow_id");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const openFlow = useCallback(
    (flowId: string) => {
      if (flowId !== createdFlow?.flow_id) {
        setCreatedFlow(null);
      }
      const params = new URLSearchParams(searchParams.toString());
      params.set("flow_id", flowId);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams, createdFlow?.flow_id],
  );

  const fetchPageData = useCallback(async () => {
    if (!teamID) {
      setIsLoadingFlows(false);
      return;
    }

    setIsLoadingFlows(true);

    try {
      await Promise.all([
        fetchTeamEmailFlowsForStore(teamID, dispatch),
        fetchEmailWorkflowEditorData(teamID, dispatch),
      ]);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to load workflows."));
    } finally {
      setIsLoadingFlows(false);
    }
  }, [teamID, dispatch]);

  useEffect(() => {
    void fetchPageData();
  }, [fetchPageData]);

  const handleCreateWorkflow = async () => {
    if (!teamID) {
      return;
    }

    const trimmedName = newWorkflowName.trim();
    if (!trimmedName) {
      toast.error("Please enter a workflow name.");
      return;
    }

    setIsCreatingWorkflow(true);
    try {
      const response = await createEmailFlow(teamID, trimmedName);
      if (!response.success || !response.data?.flow_id) {
        throw new Error(response.message || "Failed to create workflow.");
      }

      await fetchTeamEmailFlowsForStore(teamID, dispatch);
      setIsCreateDialogOpen(false);
      setNewWorkflowName("");
      if (response.data) {
        setCreatedFlow(response.data);
      }
      openFlow(response.data.flow_id);
      toast.success(response.message || "Workflow created successfully.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to create workflow."));
    } finally {
      setIsCreatingWorkflow(false);
    }
  };

  useEffect(() => {
    if (!isCanvasView) {
      return;
    }

    const wasLeftNavOpen = isLeftNavOpenRef.current;
    dispatch(setLeftNavOpen(false));

    return () => {
      dispatch(setLeftNavOpen(wasLeftNavOpen));
    };
  }, [isCanvasView, dispatch]);

  useEffect(() => {
    if (!isCanvasView) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isCanvasView]);

  return (
    <div
      className={
        isCanvasView
          ? "flex h-[calc(100dvh-65px-4rem)] max-h-[calc(100dvh-65px-4rem)] w-full flex-col overflow-hidden"
          : "flex h-full w-full min-h-0 flex-col"
      }
    >
      <div className="flex shrink-0 items-center justify-between">
        <div>
          <div className="lg:text-[22px] text-[18px] font-bold">Workflows</div>
          {!isCanvasView ? (
            <p className="mt-1 text-[13px] font-[500] text-gray-500">
              Create custom workflows or open an existing pipeline.
            </p>
          ) : null}
        </div>
        {!isCanvasView ? (
          <PrimaryButton
            onClick={() => setIsCreateDialogOpen(true)}
            className="font-[600] flex items-center justify-center gap-2 min-w-[100px] min-h-[40px] text-[13px]"
          >
            <Plus size={16} className="-ml-1" />
            <span>Create workflow</span>
          </PrimaryButton>
        ) : null}
      </div>

      {isCanvasView && selectedFlowId ? (
        <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
          <EmailWorkflowBuilder
            flowId={selectedFlowId}
            initialFlow={
              createdFlow?.flow_id === selectedFlowId ? createdFlow : null
            }
            onClose={closeBuilder}
            onSaved={() => {
              if (teamID) {
                void fetchTeamEmailFlowsForStore(teamID, dispatch);
              }
            }}
          />
        </div>
      ) : (
        <div className="mt-[24px] w-full overflow-hidden">
          <div className="relative">
            <div className="overflow-x-auto md:overflow-visible">
              <div className="inline-block min-w-full align-middle">
                <Table className="min-w-[560px] lg:min-w-full">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="min-w-[220px] font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                        Workflow
                      </TableHead>
                      <TableHead className="min-w-[160px] font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                        Agent
                      </TableHead>
                      <TableHead className="min-w-[100px] font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                        Nodes
                      </TableHead>
                      <TableHead className="min-w-[180px] pl-4 md:pl-8 lg:pl-12 font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                        Updated
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingFlows ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={4} className="py-10 text-center">
                          <Spinner />
                        </TableCell>
                      </TableRow>
                    ) : flows.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={4}
                          className="py-8 text-center text-[13px] text-gray-500"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Workflow
                              size={20}
                              className="text-gray-400"
                              aria-hidden
                            />
                            <span>No workflows configured yet.</span>
                            <span className="text-[12px] text-gray-400">
                              Workflows are team-scoped. A default workflow is
                              created when you add an email AI agent.
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      flows.map((flow) => (
                        <TableRow
                          key={flow.flow_id}
                          className="cursor-pointer hover:bg-serene-purple/5"
                          onClick={() => openFlow(flow.flow_id)}
                        >
                          <TableCell className="py-3 px-[10px] align-middle">
                            <span className="text-[13px] font-[600] text-deep-onyx">
                              {flow.name}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 px-[10px] align-middle text-[13px] text-gray-700">
                            {flow.is_attached && flow.attached_agent_name?.trim()
                              ? flow.attached_agent_name.trim()
                              : "—"}
                          </TableCell>
                          <TableCell className="py-3 px-[10px] align-middle">
                            <span className="inline-flex rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[12px] font-[600] text-gray-700">
                              {flow.node_count ?? "—"}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 px-[10px] pl-4 md:pl-8 lg:pl-12 align-middle text-[13px] text-gray-600 whitespace-nowrap">
                            {flow.updated_at
                              ? formatDateTime12hr(flow.updated_at)
                              : flow.created_at
                                ? formatDateTime12hr(flow.created_at)
                                : "—"}
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
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Create workflow</DialogTitle>
            <DialogDescription>
              Creates a new unattached workflow with a default draft pipeline.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <CustomInput
              type="text"
              value={newWorkflowName}
              onChange={(event) => setNewWorkflowName(event.target.value)}
              placeholder="Workflow name"
              className="min-h-[40px] text-[13px]"
            />
          </div>
          <DialogFooter>
            <PrimaryButton
              onClick={() => void handleCreateWorkflow()}
              disabled={isCreatingWorkflow || !newWorkflowName.trim()}
              className="min-h-[40px] text-[13px] font-[600]"
            >
              {isCreatingWorkflow ? (
                <Spinner className="border-white" />
              ) : (
                "Create"
              )}
            </PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
