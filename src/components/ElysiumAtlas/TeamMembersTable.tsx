"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CustomInput from "@/components/inputs/CustomInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Spinner from "@/components/ui/Spinner";
import {
  VISITOR_PAGE_SIZE_OPTIONS,
  type VisitorPageSize,
} from "@/lib/config";
import { removeTeamMember } from "@/utils/teamApi";
import type { TeamMember } from "@/types/teamMembers";

interface TeamMembersTableProps {
  members: TeamMember[];
  canManageMembers: boolean;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  total: number;
  pageSize: VisitorPageSize;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: VisitorPageSize) => void;
  onMemberRemoved?: () => void;
}

type TablePerson = {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  isOwner: boolean;
};
function formatRole(role: string): string {
  if (!role) return "—";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function getPersonDisplayName(person: TablePerson): string {
  const fullName = [person.first_name, person.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fullName || person.email;
}

function PersonRow({
  person,
  canManageMembers,
  onRemove,
}: {
  person: TablePerson;
  canManageMembers: boolean;
  onRemove: (person: TablePerson) => void;
}) {
  const displayName = getPersonDisplayName(person);
  const cellClass =
    "h-10 !py-0 px-[10px] text-[13px] align-middle whitespace-nowrap";

  return (
    <TableRow className="border-b border-gray-100 dark:border-deep-onyx bg-transparent transition-colors duration-200 hover:bg-serene-purple/10 dark:hover:bg-serene-purple/20">
      <TableCell
        className={`${cellClass} font-medium text-deep-onyx dark:text-pure-mist w-[260px] min-w-[260px] max-w-[260px]`}
      >
        <span className="truncate max-w-[220px] block leading-none">
          {displayName}
        </span>
      </TableCell>

      <TableCell
        className={`${cellClass} min-w-[200px] text-gray-600 dark:text-gray-300`}
      >
        <span className="truncate max-w-[220px] block leading-none">
          {person.email}
        </span>
      </TableCell>

      <TableCell className={`${cellClass} min-w-[100px] text-gray-600 dark:text-gray-300 capitalize`}>
        <span className="block leading-none">{formatRole(person.role)}</span>
      </TableCell>

      {canManageMembers && (
        <TableCell className={`${cellClass} w-[72px] min-w-[72px] text-right`}>
          {!person.isOwner && (
            <button
              type="button"
              onClick={() => onRemove(person)}
              className="inline-flex items-center justify-center p-2 rounded-[8px] text-danger-red hover:bg-danger-red hover:text-white transition-colors cursor-pointer"
              aria-label={`Remove ${displayName}`}
            >
              <Trash2 size={14} />
            </button>
          )}
        </TableCell>
      )}
    </TableRow>
  );
}
export default function TeamMembersTable({
  members,
  canManageMembers,
  currentPage,
  totalPages,
  hasNext,
  hasPrev,
  total,
  pageSize,
  isLoading,
  onPageChange,
  onPageSizeChange,
  onMemberRemoved,
}: TeamMembersTableProps) {
  const [pageInput, setPageInput] = useState("1");
  const [showRightGradient, setShowRightGradient] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TablePerson | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const tableRows: TablePerson[] = members.map((member) => ({
    user_id: member.user_id,
    email: member.email,
    first_name: member.first_name,
    last_name: member.last_name,
    role: member.role,
    isOwner: member.role === "owner",
  }));

  const handleRemoveClick = (person: TablePerson) => {
    setMemberToRemove(person);
    setRemoveDialogOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;

    setIsRemoving(true);
    try {
      const response = await removeTeamMember(memberToRemove.user_id);

      if (response.success) {
        toast.success(response.message || "Team member removed.");
        setRemoveDialogOpen(false);
        setMemberToRemove(null);
        onMemberRemoved?.();
        return;
      }

      toast.error(response.message || "Failed to remove team member.");
      if (response.message?.toLowerCase().includes("already been removed")) {
        setRemoveDialogOpen(false);
        setMemberToRemove(null);
        onMemberRemoved?.();
      }
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to remove team member.",
      );
    } finally {
      setIsRemoving(false);
    }
  };

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowRightGradient(scrollLeft + clientWidth < scrollWidth - 5);
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [tableRows]);

  const hasTableContent = tableRows.length > 0;

  const handleFirstPage = () => {
    if (currentPage > 1) onPageChange(1);
  };

  const handleLastPage = () => {
    const lastPage = Math.max(1, totalPages);
    if (currentPage < lastPage) onPageChange(lastPage);
  };

  const commitPageJump = () => {
    const parsed = parseInt(pageInput, 10);
    if (Number.isNaN(parsed)) {
      setPageInput(String(currentPage));
      return;
    }
    const effectiveTotalPages = Math.max(1, totalPages);
    const target = Math.min(
      Math.max(1, effectiveTotalPages),
      Math.max(1, parsed),
    );
    setPageInput(String(target));
    if (target !== currentPage) onPageChange(target);
  };

  const paginationBtnClass =
    "p-1.5 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors";

  const effectiveTotalPages = Math.max(1, totalPages);
  const paginationDisabled = total === 0 || isLoading;
  const columnCount = canManageMembers ? 4 : 3;

  const paginationControls = (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 mb-3">
      <div className="flex items-center justify-end gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={handleFirstPage}
          disabled={paginationDisabled || currentPage <= 1}
          className={paginationBtnClass}
          aria-label="First page"
        >
          <ChevronsLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          type="button"
          onClick={() => hasPrev && onPageChange(currentPage - 1)}
          disabled={paginationDisabled || !hasPrev}
          className={paginationBtnClass}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: effectiveTotalPages }, (_, i) => i + 1).map(
            (page) => {
              if (
                page === 1 ||
                page === effectiveTotalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    type="button"
                    key={page}
                    onClick={() => onPageChange(page)}
                    disabled={paginationDisabled}
                    className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors ${
                      paginationDisabled
                        ? "opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                        : "cursor-pointer"
                    } ${
                      !paginationDisabled && currentPage === page
                        ? "bg-serene-purple text-white border-serene-purple"
                        : !paginationDisabled
                          ? "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                          : ""
                    }`}
                  >
                    {page}
                  </button>
                );
              }
              if (page === currentPage - 2 || page === currentPage + 2) {
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
          type="button"
          onClick={() => hasNext && onPageChange(currentPage + 1)}
          disabled={paginationDisabled || !hasNext}
          className={paginationBtnClass}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          type="button"
          onClick={handleLastPage}
          disabled={paginationDisabled || currentPage >= effectiveTotalPages}
          className={paginationBtnClass}
          aria-label="Last page"
        >
          <ChevronsRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <div className="flex items-center justify-between w-full sm:contents">
        <div className="flex items-center gap-2 text-[12px] text-gray-500 dark:text-gray-400">
          <span className="whitespace-nowrap">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) =>
              onPageSizeChange(Number(value) as VisitorPageSize)
            }
            disabled={isLoading}
          >
            <SelectTrigger
              aria-label="Rows per page"
              className="h-9 w-[72px] border-[2px] border-gray-300 dark:border-deep-onyx rounded-[10px] bg-white dark:bg-deep-onyx text-[13px] font-[600] text-deep-onyx dark:text-pure-mist shadow-none focus-visible:border-serene-purple focus-visible:ring-serene-purple/30 px-2"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {VISITOR_PAGE_SIZE_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 text-[12px] text-gray-500 dark:text-gray-400">
          <span className="whitespace-nowrap">Go to</span>
          <CustomInput
            type="number"
            min={1}
            max={effectiveTotalPages}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitPageJump();
              }
            }}
            onBlur={commitPageJump}
            disabled={paginationDisabled}
            aria-label="Page number"
            className="w-[52px] h-9 text-center text-[13px] py-2 px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="whitespace-nowrap">of {effectiveTotalPages}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full mt-[12px] overflow-hidden">
      {paginationControls}

      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto md:overflow-visible"
        >
          <div className="inline-block min-w-full align-middle">
            <Table className="min-w-[400px] lg:min-w-full [&_tbody_tr]:bg-transparent">
              <TableHeader>
                <TableRow className="bg-transparent hover:bg-transparent dark:hover:bg-transparent">
                  <TableHead className="h-10 w-[260px] max-w-[260px] font-[600] !py-0 px-[10px] text-[13px] whitespace-nowrap align-middle">
                    Member
                  </TableHead>
                  <TableHead className="h-10 min-w-[200px] font-[600] !py-0 px-[10px] text-[13px] whitespace-nowrap align-middle">
                    Email
                  </TableHead>
                  <TableHead className="h-10 min-w-[100px] font-[600] !py-0 px-[10px] text-[13px] whitespace-nowrap align-middle">
                    Role
                  </TableHead>
                  {canManageMembers && (
                    <TableHead className="h-10 w-[72px] min-w-[72px] font-[600] !py-0 px-[10px] text-[13px] whitespace-nowrap align-middle text-right">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && tableRows.length === 0 ? (
                  <TableRow className="bg-transparent hover:bg-transparent">
                    <TableCell
                      colSpan={columnCount}
                      className="py-10 text-center text-[14px] text-gray-500 dark:text-gray-400"
                    >
                      Loading team members...
                    </TableCell>
                  </TableRow>
                ) : tableRows.length === 0 ? (
                  <TableRow className="bg-transparent hover:bg-transparent">
                    <TableCell
                      colSpan={columnCount}
                      className="py-10 text-center text-[14px] text-gray-500 dark:text-gray-400"
                    >
                      {canManageMembers
                        ? "No team members yet. Invite someone to get started."
                        : "No other team members yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  tableRows.map((person) => (
                    <PersonRow
                      key={person.user_id}
                      person={person}
                      canManageMembers={canManageMembers}
                      onRemove={handleRemoveClick}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {showRightGradient && hasTableContent && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-black dark:via-black/80 to-transparent pointer-events-none z-10 md:hidden" />
        )}
      </div>

      <Dialog
        open={removeDialogOpen}
        onOpenChange={(open) => {
          setRemoveDialogOpen(open);
          if (!open) setMemberToRemove(null);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Remove team member</DialogTitle>
            <DialogDescription>
              Remove{" "}
              <span className="font-semibold text-deep-onyx dark:text-pure-mist">
                {memberToRemove ? getPersonDisplayName(memberToRemove) : ""}
              </span>{" "}
              from your team? They will lose access to this team.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <PrimaryButton
                className="bg-transparent border border-gray-300 dark:border-white text-gray-700 dark:text-white text-[12px] hover:bg-white dark:hover:bg-pure-mist dark:hover:text-deep-onyx"
                disabled={isRemoving}
              >
                Cancel
              </PrimaryButton>
            </DialogClose>
            <PrimaryButton
              className="min-w-[95px] text-[12px] font-semibold bg-danger-red hover:bg-danger-red/90 flex items-center gap-2"
              onClick={handleConfirmRemove}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <Spinner className="border-white dark:border-deep-onyx" />
              ) : (
                "Remove"
              )}
            </PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
