"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAppSelector, useAppDispatch } from "@/store";
import { useRouter } from "next/navigation";
import NProgress from "nprogress";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { formatDateTime12hr } from "@/utils/formatDate";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import fastApiAxios from "@/utils/fastapi_axios";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { triggerFetchAgents } from "@/store/reducers/userAgentsSlice";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Spinner from "@/components/ui/Spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCanManageAgents } from "@/hooks/useCanManageAgents";
import {
  getAgentStatusTextClass,
  isSettledAgentStatus,
} from "@/utils/agentStatus";
import TablePaginationControls from "./TablePaginationControls";
import { type VisitorPageSize } from "@/lib/config";

interface MyAgentsTableProps {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  total: number;
  pageSize: VisitorPageSize;
  pageSizeOptions?: readonly number[];
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: VisitorPageSize) => void;
}

export default function MyAgentsTable({
  currentPage,
  totalPages,
  hasNext,
  hasPrev,
  total,
  pageSize,
  pageSizeOptions,
  isLoading,
  onPageChange,
  onPageSizeChange,
}: MyAgentsTableProps) {
  const agents = useAppSelector((state) => state.userAgents.myAgents);
  const canManageAgents = useCanManageAgents();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<any>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [agentForStatusChange, setAgentForStatusChange] = useState<any>(null);
  const [pendingAgentStatus, setPendingAgentStatus] = useState<
    "active" | "disabled" | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
      setShowLeftGradient(scrollLeft > 0);
      setShowRightGradient(scrollLeft + clientWidth < scrollWidth - 5);
    };

    handleScroll();

    scrollContainer.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [agents]);

  const handleAgentClick = (agentId: string) => {
    NProgress.start();
    router.push(`/my-agents/${agentId}`);
  };

  const handleDeleteAgent = (agent: any) => {
    setAgentToDelete(agent);
    setDeleteDialogOpen(true);
  };

  const handleAgentStatusChange = (
    agent: any,
    status: "active" | "disabled",
  ) => {
    setAgentForStatusChange(agent);
    setPendingAgentStatus(status);
    setStatusDialogOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!agentForStatusChange || !pendingAgentStatus) return;

    setIsUpdatingStatus(true);
    const token = Cookies.get("elysium_atlas_session_token");
    const isEnabling = pendingAgentStatus === "active";

    try {
      const response = await fastApiAxios.post(
        "/elysium-agents/elysium-atlas/agent/v1/update-agent",
        {
          agent_id: agentForStatusChange.agent_id,
          agent_status: pendingAgentStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success === true) {
        toast.success(
          response.data.message ||
            (isEnabling
              ? "Agent enabled successfully!"
              : "Agent disabled successfully!"),
        );
        dispatch(triggerFetchAgents());
        setStatusDialogOpen(false);
        setAgentForStatusChange(null);
        setPendingAgentStatus(null);
      } else {
        toast.error(
          response.data.message ||
            (isEnabling ? "Failed to enable agent" : "Failed to disable agent"),
        );
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        (isEnabling
          ? "Failed to enable agent. Please try again."
          : "Failed to disable agent. Please try again.");
      toast.error(errorMessage);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!agentToDelete) return;

    setIsDeleting(true);
    const token = Cookies.get("elysium_atlas_session_token");

    try {
      const response = await fastApiAxios.post(
        "/elysium-agents/elysium-atlas/agent/v1/delete-agent",
        {
          agent_id: agentToDelete.agent_id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success === true) {
        toast.success("Agent deleted successfully!");
        dispatch(triggerFetchAgents());
        setDeleteDialogOpen(false);
        setAgentToDelete(null);
      } else {
        toast.error(response.data.message || "Failed to delete agent");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete agent. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full mt-[24px] overflow-hidden">
      <TablePaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        hasNext={hasNext}
        hasPrev={hasPrev}
        total={total}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        isLoading={isLoading}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />

      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto md:overflow-visible"
        >
          <div className="inline-block min-w-full align-middle">
            <Table className="min-w-[600px] lg:min-w-full ">
              <TableHeader>
                <TableRow className="hover:bg-transparent ">
                  <TableHead className="w-[200px] lg:w-[300px] font-[600] py-2 px-[10px] text-[14px] whitespace-nowrap">
                    Name
                  </TableHead>
                  <TableHead className="min-w-[120px] lg:min-w-[100px] lg:max-w-[200px] font-[600] py-2 px-[10px] text-[14px] whitespace-nowrap">
                    Status
                  </TableHead>
                  <TableHead className="min-w-[200px] pl-4 md:pl-8 lg:pl-12 font-[600] py-2 px-[10px] text-[14px] whitespace-nowrap">
                    Last Updated
                  </TableHead>
                  <TableHead className="w-[40px] md:w-[60px] py-2 px-[10px] text-[14px] whitespace-nowrap"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && agents.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={4} className="py-10 text-center">
                      <Spinner className="mx-auto border-serene-purple" />
                    </TableCell>
                  </TableRow>
                ) : (
                  agents.map((agent: any) => (
                    <TableRow
                      key={agent.agent_id}
                      className="cursor-pointer border-b border-gray-100 dark:border-deep-onyx hover:bg-serene-purple/10 dark:hover:bg-serene-purple/20 hover:text-serene-purple dark:hover:text-serene-purple transition-all duration-200"
                      onClick={() => handleAgentClick(agent.agent_id)}
                    >
                      <TableCell className="font-medium w-[300px] py-2 px-[10px] text-[14px] whitespace-nowrap text-deep-onyx dark:text-pure-mist">
                        <div className="flex items-center gap-2">
                          {agent.agent_name.length > 20 ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="truncate cursor-default">
                                  {`${agent.agent_name.slice(0, 20)}...`}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {agent.agent_name}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <div className="truncate">{agent.agent_name}</div>
                          )}
                          {agent.live_visitors > 0 && (
                            <span className="inline-flex items-center shrink-0 rounded-full bg-serene-purple/15 text-serene-purple px-2 py-0.5 text-[10px] font-semibold">
                              {agent.live_visitors} online
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell
                        className={`font-medium min-w-[120px] lg:min-w-[100px] lg:max-w-[200px] py-2 px-[10px] text-[14px] whitespace-nowrap ${getAgentStatusTextClass(agent.agent_status)}`}
                      >
                        {agent.agent_status}
                      </TableCell>
                      <TableCell className="min-w-[200px] pl-4 md:pl-8 lg:pl-12 py-2 px-[10px] text-[14px] whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {formatDateTime12hr(agent.updated_at)}
                      </TableCell>
                      <TableCell className="w-[40px] md:w-[60px] py-2 px-[10px] text-right">
                        {canManageAgents ? (
                          <div className="mx-auto flex items-center justify-center h-[30px] w-[30px]">
                            {isSettledAgentStatus(agent.agent_status) ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <div
                                    className="flex items-center justify-center rounded-full bg-transparent hover:bg-serene-purple/10 dark:hover:bg-serene-purple/20 transition-colors duration-150 cursor-pointer h-[30px] w-[30px] border-none focus:outline-none focus:ring-0"
                                    tabIndex={0}
                                    role="button"
                                    aria-label="More options"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <MoreHorizontal
                                      className="text-gray-400 hover:text-serene-purple dark:text-gray-600 dark:hover:text-gray-300"
                                      size={18}
                                    />
                                  </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-[160px]"
                                >
                                  {agent.agent_status.toLowerCase() ===
                                  "disabled" ? (
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAgentStatusChange(agent, "active");
                                      }}
                                      className="cursor-pointer"
                                    >
                                      Enable Agent
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAgentStatusChange(
                                          agent,
                                          "disabled",
                                        );
                                      }}
                                      className="cursor-pointer"
                                    >
                                      Disable Agent
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteAgent(agent);
                                    }}
                                    className="cursor-pointer text-danger-red focus:text-danger-red"
                                    variant="destructive"
                                  >
                                    Delete Agent
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <div
                                className="flex items-center justify-center rounded-full h-[30px] w-[30px] opacity-40 cursor-not-allowed"
                                aria-label="Actions unavailable while agent is updating"
                              >
                                <MoreHorizontal
                                  className="text-gray-400 dark:text-gray-600"
                                  size={18}
                                />
                              </div>
                            )}
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {showLeftGradient && (
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-black dark:via-black/80 to-transparent pointer-events-none z-10 md:hidden" />
          )}
          {showRightGradient && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-black dark:via-black/80 to-transparent pointer-events-none z-10 md:hidden" />
          )}
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Agent</DialogTitle>
            <DialogDescription>
              This will permanently delete the agent "
              {agentToDelete?.agent_name}". This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <PrimaryButton
                className="bg-transparent border border-gray-300 dark:border-white text-gray-700 dark:text-white text-[12px] hover:bg-white dark:hover:bg-pure-mist dark:hover:text-deep-onyx"
                disabled={isDeleting}
              >
                Cancel
              </PrimaryButton>
            </DialogClose>
            <PrimaryButton
              className="min-w-[95px] text-[12px] font-semibold bg-danger-red hover:bg-danger-red/90 flex items-center gap-2"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Confirm"}
            </PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={statusDialogOpen}
        onOpenChange={(open) => {
          setStatusDialogOpen(open);
          if (!open) {
            setAgentForStatusChange(null);
            setPendingAgentStatus(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {pendingAgentStatus === "active"
                ? "Enable Agent"
                : "Disable Agent"}
            </DialogTitle>
            <DialogDescription>
              {pendingAgentStatus === "active"
                ? `This will enable the agent "${agentForStatusChange?.agent_name}" and make it available for use again.`
                : `This will disable the agent "${agentForStatusChange?.agent_name}". Disabled agents will no longer be available for use.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <PrimaryButton
                className="bg-transparent border border-gray-300 dark:border-white text-gray-700 dark:text-white text-[12px] hover:bg-white dark:hover:bg-pure-mist dark:hover:text-deep-onyx"
                disabled={isUpdatingStatus}
              >
                Cancel
              </PrimaryButton>
            </DialogClose>
            <PrimaryButton
              className="min-w-[95px] text-[12px] font-semibold flex items-center gap-2"
              onClick={handleConfirmStatusChange}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus
                ? pendingAgentStatus === "active"
                  ? "Enabling..."
                  : "Disabling..."
                : "Confirm"}
            </PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
