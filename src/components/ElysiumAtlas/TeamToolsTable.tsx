"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
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
import ToolFormDialog from "@/components/ElysiumAtlas/ToolFormDialog";
import TablePaginationControls from "@/components/ElysiumAtlas/TablePaginationControls";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type VisitorPageSize } from "@/lib/config";
import { deleteTool } from "@/utils/toolsApi";
import { extractApiErrorMessage } from "@/utils/toolsFormUtils";
import type { Tool } from "@/types/tools";

interface TeamToolsTableProps {
  tools: Tool[];
  canManageTools: boolean;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  total: number;
  pageSize: VisitorPageSize;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: VisitorPageSize) => void;
  onToolChanged?: () => void;
}

function ToolRow({
  tool,
  canManageTools,
  onEdit,
  onDelete,
}: {
  tool: Tool;
  canManageTools: boolean;
  onEdit: (tool: Tool) => void;
  onDelete: (tool: Tool) => void;
}) {
  const cellClass =
    "h-10 !py-0 px-[10px] text-[13px] align-middle whitespace-nowrap";

  const displayLabel = tool.display_name || tool.name;

  return (
    <TableRow className="border-b border-gray-100 dark:border-deep-onyx bg-transparent transition-colors duration-200 hover:bg-serene-purple/10 dark:hover:bg-serene-purple/20">
      <TableCell
        className={`${cellClass} font-medium text-deep-onyx dark:text-pure-mist min-w-[200px]`}
      >
        <span className="truncate max-w-[280px] block leading-none">
          {displayLabel}
        </span>
      </TableCell>

      <TableCell className={`${cellClass} w-[100px] min-w-[100px] text-gray-600 dark:text-gray-300`}>
        <span className="block leading-none font-semibold">{tool.http_method}</span>
      </TableCell>

      <TableCell
        className={`${cellClass} min-w-[240px] text-gray-600 dark:text-gray-300`}
      >
        <span className="truncate max-w-full block leading-none text-[12px]">
          {tool.api_url}
        </span>
      </TableCell>

      {canManageTools && (
        <TableCell className={`${cellClass} w-[100px] min-w-[100px] text-right`}>
          <div className="inline-flex items-center justify-end gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onEdit(tool)}
                  className="inline-flex items-center justify-center p-2 rounded-[8px] text-serene-purple hover:bg-serene-purple hover:text-white transition-colors cursor-pointer"
                  aria-label={`Edit ${displayLabel}`}
                >
                  <Pencil size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Edit tool</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onDelete(tool)}
                  className="inline-flex items-center justify-center p-2 rounded-[8px] text-danger-red hover:bg-danger-red hover:text-white transition-colors cursor-pointer"
                  aria-label={`Delete ${displayLabel}`}
                >
                  <Trash2 size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Delete tool</TooltipContent>
            </Tooltip>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}

export default function TeamToolsTable({
  tools,
  canManageTools,
  currentPage,
  totalPages,
  hasNext,
  hasPrev,
  total,
  pageSize,
  isLoading,
  onPageChange,
  onPageSizeChange,
  onToolChanged,
}: TeamToolsTableProps) {
  const [showRightGradient, setShowRightGradient] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toolToDelete, setToolToDelete] = useState<Tool | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [toolToEdit, setToolToEdit] = useState<Tool | null>(null);

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
  }, [tools]);

  const handleEditClick = (tool: Tool) => {
    setToolToEdit(tool);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (tool: Tool) => {
    setToolToDelete(tool);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!toolToDelete) return;

    setIsDeleting(true);
    try {
      const response = await deleteTool(toolToDelete.tool_id);

      if (response.success) {
        toast.success(response.message || "Tool deleted successfully.");
        setDeleteDialogOpen(false);
        setToolToDelete(null);
        onToolChanged?.();
        return;
      }

      toast.error(response.message || "Failed to delete tool.");
    } catch (error: unknown) {
      toast.error(extractApiErrorMessage(error, "Failed to delete tool."));
    } finally {
      setIsDeleting(false);
    }
  };

  const hasTableContent = tools.length > 0;
  const columnCount = canManageTools ? 4 : 3;

  return (
    <div className="w-full mt-[12px] overflow-hidden">
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto md:overflow-visible"
        >
          <div className="inline-block min-w-full align-middle">
            <Table className="min-w-[400px] lg:min-w-full [&_tbody_tr]:bg-transparent">
              <TableHeader>
                <TableRow className="bg-transparent hover:bg-transparent dark:hover:bg-transparent">
                  <TableHead className="h-10 min-w-[200px] font-[600] !py-0 px-[10px] text-[13px] whitespace-nowrap align-middle">
                    Display name
                  </TableHead>
                  <TableHead className="h-10 w-[100px] min-w-[100px] font-[600] !py-0 px-[10px] text-[13px] whitespace-nowrap align-middle">
                    Method
                  </TableHead>
                  <TableHead className="h-10 min-w-[240px] font-[600] !py-0 px-[10px] text-[13px] whitespace-nowrap align-middle">
                    API URL
                  </TableHead>
                  {canManageTools && (
                    <TableHead className="h-10 w-[100px] min-w-[100px] font-[600] !py-0 px-[10px] text-[13px] whitespace-nowrap align-middle text-right">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && tools.length === 0 ? (
                  <TableRow className="bg-transparent hover:bg-transparent">
                    <TableCell
                      colSpan={columnCount}
                      className="py-10 text-center text-[14px] text-gray-500 dark:text-gray-400"
                    >
                      Loading tools...
                    </TableCell>
                  </TableRow>
                ) : tools.length === 0 ? (
                  <TableRow className="bg-transparent hover:bg-transparent">
                    <TableCell
                      colSpan={columnCount}
                      className="py-10 text-center text-[14px] text-gray-500 dark:text-gray-400"
                    >
                      {canManageTools
                        ? "No tools yet. Add one to get started."
                        : "No tools configured for this team yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  tools.map((tool) => (
                    <ToolRow
                      key={tool.tool_id}
                      tool={tool}
                      canManageTools={canManageTools}
                      onEdit={handleEditClick}
                      onDelete={handleDeleteClick}
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

      <TablePaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        hasNext={hasNext}
        hasPrev={hasPrev}
        total={total}
        pageSize={pageSize}
        isLoading={isLoading}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        recordLabel="tool"
        recordLabelPlural="tools"
        className="mt-3 mb-0"
      />

      {toolToEdit && (
        <ToolFormDialog
          mode="edit"
          toolId={toolToEdit.tool_id}
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setToolToEdit(null);
          }}
          onSuccess={() => {
            setEditDialogOpen(false);
            setToolToEdit(null);
            onToolChanged?.();
          }}
        />
      )}

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setToolToDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete tool</DialogTitle>
            <DialogDescription>
              Permanently delete{" "}
              <span className="font-semibold text-deep-onyx dark:text-pure-mist">
                {toolToDelete?.display_name ?? toolToDelete?.name ?? ""}
              </span>
              {toolToDelete?.display_name && toolToDelete.name && (
                <span className="font-mono text-[12px] text-gray-500 dark:text-gray-400">
                  {" "}
                  ({toolToDelete.name})
                </span>
              )}
              ? This cannot be undone.
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
              {isDeleting ? (
                <Spinner className="border-white dark:border-deep-onyx" />
              ) : (
                "Delete"
              )}
            </PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
