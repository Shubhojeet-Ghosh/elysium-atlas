"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, KeyRound, Pencil, Trash2 } from "lucide-react";
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
import PluginFormDialog from "@/components/ElysiumAtlas/PluginFormDialog";
import PluginSecretsDialog from "@/components/ElysiumAtlas/PluginSecretsDialog";
import TablePaginationControls from "@/components/ElysiumAtlas/TablePaginationControls";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type VisitorPageSize } from "@/lib/config";
import { deletePlugin } from "@/utils/pluginsApi";
import { getPluginParameterChips } from "@/utils/pluginFormUtils";
import { extractApiErrorMessage } from "@/utils/toolsFormUtils";
import type { Plugin } from "@/types/plugins";

interface TeamPluginsTableProps {
  plugins: Plugin[];
  canManagePlugins: boolean;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  total: number;
  pageSize: VisitorPageSize;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: VisitorPageSize) => void;
  onPluginChanged?: () => void;
}

function pluginHasSecrets(plugin: Plugin): boolean {
  return (plugin.secret_names ?? []).length > 0;
}

function PluginRow({
  plugin,
  canManagePlugins,
  onView,
  onEdit,
  onSecrets,
  onDelete,
}: {
  plugin: Plugin;
  canManagePlugins: boolean;
  onView: (plugin: Plugin) => void;
  onEdit: (plugin: Plugin) => void;
  onSecrets: (plugin: Plugin) => void;
  onDelete: (plugin: Plugin) => void;
}) {
  const cellClass =
    "px-[10px] py-2.5 text-[13px] align-middle";
  const displayLabel = plugin.display_name || plugin.name;
  const inputCount = getPluginParameterChips(plugin.parameters).length;
  const hasSecrets = pluginHasSecrets(plugin);

  return (
    <TableRow className="border-b border-gray-100 dark:border-deep-onyx bg-transparent transition-colors duration-200 hover:bg-serene-purple/10 dark:hover:bg-serene-purple/20">
      <TableCell
        className={`${cellClass} font-medium text-deep-onyx dark:text-pure-mist min-w-[200px]`}
      >
        <span className="block leading-5">{displayLabel}</span>
      </TableCell>

      <TableCell
        className={`${cellClass} min-w-[160px] text-gray-600 dark:text-gray-300`}
      >
        <span className="block leading-5 font-mono text-[12px]">
          {plugin.name}
        </span>
      </TableCell>

      <TableCell
        className={`${cellClass} w-[90px] min-w-[90px] text-gray-600 dark:text-gray-300`}
      >
        <span className="block leading-5">{inputCount}</span>
      </TableCell>

      <TableCell className={`${cellClass} w-[132px] min-w-[132px] text-right`}>
        <div className="inline-flex items-center justify-end gap-1">
          {canManagePlugins ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onEdit(plugin)}
                    className="inline-flex items-center justify-center p-2 rounded-[8px] text-serene-purple hover:bg-serene-purple hover:text-white transition-colors cursor-pointer"
                    aria-label={`Edit ${displayLabel}`}
                  >
                    <Pencil size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Edit plugin</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <button
                      type="button"
                      onClick={() => onSecrets(plugin)}
                      disabled={!hasSecrets}
                      className={`inline-flex items-center justify-center p-2 rounded-[8px] transition-colors ${
                        hasSecrets
                          ? "text-serene-purple hover:bg-serene-purple hover:text-white cursor-pointer"
                          : "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                      }`}
                      aria-label={`Configure secrets for ${displayLabel}`}
                    >
                      <KeyRound size={14} />
                    </button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {hasSecrets
                    ? "Configure secrets"
                    : "No secrets in this plugin"}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => onDelete(plugin)}
                    className="inline-flex items-center justify-center p-2 rounded-[8px] text-danger-red hover:bg-danger-red hover:text-white transition-colors cursor-pointer"
                    aria-label={`Delete ${displayLabel}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Delete plugin</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onView(plugin)}
                  className="inline-flex items-center justify-center p-2 rounded-[8px] text-serene-purple hover:bg-serene-purple hover:text-white transition-colors cursor-pointer"
                  aria-label={`View ${displayLabel}`}
                >
                  <Eye size={14} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">View plugin</TooltipContent>
            </Tooltip>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function TeamPluginsTable({
  plugins,
  canManagePlugins,
  currentPage,
  totalPages,
  hasNext,
  hasPrev,
  total,
  pageSize,
  isLoading,
  onPageChange,
  onPageSizeChange,
  onPluginChanged,
}: TeamPluginsTableProps) {
  const [showRightGradient, setShowRightGradient] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pluginToDelete, setPluginToDelete] = useState<Plugin | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [pluginToOpen, setPluginToOpen] = useState<Plugin | null>(null);
  const [formMode, setFormMode] = useState<"edit" | "view">("edit");
  const [secretsDialogOpen, setSecretsDialogOpen] = useState(false);
  const [pluginForSecrets, setPluginForSecrets] = useState<Plugin | null>(null);

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
  }, [plugins]);

  const handleViewClick = (plugin: Plugin) => {
    setPluginToOpen(plugin);
    setFormMode("view");
    setFormDialogOpen(true);
  };

  const handleEditClick = (plugin: Plugin) => {
    setPluginToOpen(plugin);
    setFormMode("edit");
    setFormDialogOpen(true);
  };

  const handleSecretsClick = (plugin: Plugin) => {
    if (!pluginHasSecrets(plugin)) return;
    setPluginForSecrets(plugin);
    setSecretsDialogOpen(true);
  };

  const handleDeleteClick = (plugin: Plugin) => {
    setPluginToDelete(plugin);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pluginToDelete) return;

    setIsDeleting(true);
    try {
      const response = await deletePlugin(pluginToDelete.plugin_id);

      if (response.success) {
        toast.success(response.message || "Plugin deleted successfully.");
        setDeleteDialogOpen(false);
        setPluginToDelete(null);
        onPluginChanged?.();
        return;
      }

      toast.error(response.message || "Failed to delete plugin.");
    } catch (error: unknown) {
      toast.error(extractApiErrorMessage(error, "Failed to delete plugin."));
    } finally {
      setIsDeleting(false);
    }
  };

  const hasTableContent = plugins.length > 0;
  const columnCount = 4;

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
                  <TableHead className="h-auto min-w-[200px] font-[600] px-[10px] py-2.5 text-[13px] whitespace-nowrap align-middle">
                    Display name
                  </TableHead>
                  <TableHead className="h-auto min-w-[160px] font-[600] px-[10px] py-2.5 text-[13px] whitespace-nowrap align-middle">
                    Function name
                  </TableHead>
                  <TableHead className="h-auto w-[90px] min-w-[90px] font-[600] px-[10px] py-2.5 text-[13px] whitespace-nowrap align-middle">
                    Inputs
                  </TableHead>
                  <TableHead className="h-auto w-[132px] min-w-[132px] font-[600] px-[10px] py-2.5 text-[13px] whitespace-nowrap align-middle text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && plugins.length === 0 ? (
                  <TableRow className="bg-transparent hover:bg-transparent">
                    <TableCell
                      colSpan={columnCount}
                      className="py-10 text-center text-[14px] text-gray-500 dark:text-gray-400"
                    >
                      Loading plugins...
                    </TableCell>
                  </TableRow>
                ) : plugins.length === 0 ? (
                  <TableRow className="bg-transparent hover:bg-transparent">
                    <TableCell
                      colSpan={columnCount}
                      className="py-10 text-center text-[14px] text-gray-500 dark:text-gray-400"
                    >
                      {canManagePlugins
                        ? "No plugins yet. Add one to get started."
                        : "No plugins configured for this team yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  plugins.map((plugin) => (
                    <PluginRow
                      key={plugin.plugin_id}
                      plugin={plugin}
                      canManagePlugins={canManagePlugins}
                      onView={handleViewClick}
                      onEdit={handleEditClick}
                      onSecrets={handleSecretsClick}
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
        recordLabel="plugin"
        recordLabelPlural="plugins"
        className="mt-3 mb-0"
      />

      {pluginToOpen && (
        <PluginFormDialog
          mode={formMode}
          pluginId={pluginToOpen.plugin_id}
          open={formDialogOpen}
          onOpenChange={(open) => {
            setFormDialogOpen(open);
            if (!open) setPluginToOpen(null);
          }}
          onSuccess={() => {
            setFormDialogOpen(false);
            setPluginToOpen(null);
            onPluginChanged?.();
          }}
        />
      )}

      {pluginForSecrets && (
        <PluginSecretsDialog
          pluginId={pluginForSecrets.plugin_id}
          open={secretsDialogOpen}
          onOpenChange={(open) => {
            setSecretsDialogOpen(open);
            if (!open) setPluginForSecrets(null);
          }}
          onSuccess={() => {
            setSecretsDialogOpen(false);
            setPluginForSecrets(null);
            onPluginChanged?.();
          }}
        />
      )}

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setPluginToDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete plugin</DialogTitle>
            <DialogDescription>
              Permanently delete{" "}
              <span className="font-semibold text-deep-onyx dark:text-pure-mist">
                {pluginToDelete?.display_name ?? pluginToDelete?.name ?? ""}
              </span>
              {pluginToDelete?.display_name && pluginToDelete.name && (
                <span className="font-mono text-[12px] text-gray-500 dark:text-gray-400">
                  {" "}
                  ({pluginToDelete.name})
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
