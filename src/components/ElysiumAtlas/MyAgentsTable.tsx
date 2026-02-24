"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
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
import { AgentStatusPill } from "./AgentStatusPill";
import { CircularProgress } from "./CircularProgress";
import { MoreHorizontal, Search } from "lucide-react";
import CustomInput from "@/components/inputs/CustomInput";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function MyAgentsTable() {
  const agents = useAppSelector((state) => state.userAgents.myAgents);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const AGENTS_PER_PAGE = 5;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter agents based on search term
  const filteredAgents = useMemo(() => {
    if (!searchTerm.trim()) {
      return agents || [];
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return (agents || []).filter(
      (agent: any) =>
        agent.agent_name.toLowerCase().includes(lowerSearchTerm) ||
        agent.agent_status.toLowerCase().includes(lowerSearchTerm),
    );
  }, [agents, searchTerm]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredAgents.length / AGENTS_PER_PAGE);
  const startIndex = (currentPage - 1) * AGENTS_PER_PAGE;
  const endIndex = startIndex + AGENTS_PER_PAGE;
  const currentAgents = useMemo(
    () => filteredAgents.slice(startIndex, endIndex),
    [filteredAgents, startIndex, endIndex],
  );

  // Handle scroll to detect gradient visibility
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
      // Show left gradient if scrolled right
      setShowLeftGradient(scrollLeft > 0);
      // Show right gradient if not at the end
      setShowRightGradient(scrollLeft + clientWidth < scrollWidth - 5);
    };

    // Check initial state
    handleScroll();

    scrollContainer.addEventListener("scroll", handleScroll);
    // Also check on resize
    window.addEventListener("resize", handleScroll);

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [currentAgents]);

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };
  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  const handleAgentClick = (agentId: string) => {
    NProgress.start();
    router.push(`/my-agents/${agentId}`);
  };

  const handleDeleteAgent = (agent: any) => {
    setAgentToDelete(agent);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!agentToDelete) return;

    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  if (!agents || agents.length === 0) {
    return null;
  }

  return (
    <div className="w-full mt-[24px] overflow-hidden">
      {/* Search Bar */}
      {agents && agents.length > 0 && (
        <div className="flex justify-end mb-[2px]">
          <div className="relative lg:w-[280px] w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <CustomInput
              type="text"
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-[11px] h-10"
            />
          </div>
        </div>
      )}

      {filteredAgents.length === 0 && searchTerm.trim() ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-[12px] px-4 md:px-0">
          No agents found matching "{searchTerm}"
        </div>
      ) : (
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
                  {currentAgents.map((agent: any, idx: number) => (
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
                      <TableCell className="font-medium min-w-[120px] lg:min-w-[100px] lg:max-w-[200px] py-2 px-[10px] text-[14px] whitespace-nowrap">
                        <AgentStatusPill
                          status={agent.agent_status}
                          className="min-h-[20px] min-w-[50px] text-[11px] px-1.5 py-0.5"
                        />
                      </TableCell>
                      <TableCell className="min-w-[200px] pl-4 md:pl-8 lg:pl-12 py-2 px-[10px] text-[14px] whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {formatDateTime12hr(agent.updated_at)}
                      </TableCell>
                      <TableCell className="w-[40px] md:w-[60px] py-2 px-[10px] text-right">
                        {["active", "inactive", "failed"].includes(
                          agent.agent_status.toLowerCase(),
                        ) ? (
                          <div className="mx-auto flex items-center justify-center h-[30px] w-[30px]">
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
                          </div>
                        ) : (
                          <div className="mx-auto flex items-center justify-center h-[30px] w-[30px]">
                            <CircularProgress
                              percentage={agent.progress || null}
                              size={24}
                              strokeWidth={2}
                            />
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-end my-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      aria-label="Previous page"
                    >
                      <svg
                        className="h-4 w-4 text-gray-600 dark:text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => {
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => handlePageClick(page)}
                                className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors cursor-pointer ${
                                  currentPage === page
                                    ? "bg-serene-purple text-white border-serene-purple"
                                    : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                }`}
                              >
                                {page}
                              </button>
                            );
                          } else if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          ) {
                            return (
                              <span
                                key={page}
                                className="px-1 text-[11px] text-gray-400 dark:text-gray-500"
                              >
                                ...
                              </span>
                            );
                          }
                          return null;
                        },
                      )}
                    </div>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      aria-label="Next page"
                    >
                      <svg
                        className="h-4 w-4 text-gray-600 dark:text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* Left gradient overlay */}
            {showLeftGradient && (
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-black dark:via-black/80 to-transparent pointer-events-none z-10 md:hidden" />
            )}
            {/* Right gradient overlay */}
            {showRightGradient && (
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-black dark:via-black/80 to-transparent pointer-events-none z-10 md:hidden" />
            )}
          </div>
        </div>
      )}
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
                disabled={isLoading}
              >
                Cancel
              </PrimaryButton>
            </DialogClose>
            <PrimaryButton
              className="min-w-[95px] text-[12px] font-semibold bg-danger-red hover:bg-danger-red/90 flex items-center gap-2"
              onClick={handleConfirmDelete}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Confirm"}
            </PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
