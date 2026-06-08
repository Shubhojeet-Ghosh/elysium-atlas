"use client";

import { Trash2, X } from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";

interface EmailWorkflowEdgePanelProps {
  edgeId: string;
  sourceLabel: string;
  targetLabel: string;
  isEditable: boolean;
  onDelete: () => void;
  onClose: () => void;
}

export default function EmailWorkflowEdgePanel({
  edgeId,
  sourceLabel,
  targetLabel,
  isEditable,
  onDelete,
  onClose,
}: EmailWorkflowEdgePanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-gray-100 px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-[600] text-deep-onyx">Connection</p>
            <p className="mt-1 truncate text-[12px] font-[500] text-gray-500">
              {edgeId}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close connection settings"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-gray-500 transition-colors hover:bg-gray-100 hover:text-deep-onyx cursor-pointer"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-4">
          <div className="rounded-[12px] border border-gray-200 bg-pure-mist/40 p-4">
            <p className="text-[11px] font-[600] uppercase tracking-wide text-gray-500">
              From
            </p>
            <p className="mt-1 text-[13px] font-[600] text-deep-onyx">
              {sourceLabel}
            </p>
          </div>
          <div className="rounded-[12px] border border-gray-200 bg-pure-mist/40 p-4">
            <p className="text-[11px] font-[600] uppercase tracking-wide text-gray-500">
              To
            </p>
            <p className="mt-1 text-[13px] font-[600] text-deep-onyx">
              {targetLabel}
            </p>
          </div>
          <p className="text-[12px] text-gray-500 leading-snug">
            Drag from a node handle to create connections. Select a connection
            and delete it here, or press Delete / Backspace.
          </p>
        </div>
      </div>

      {isEditable ? (
        <div className="shrink-0 border-t border-gray-100 p-4">
          <PrimaryButton
            type="button"
            onClick={onDelete}
            className="flex w-full min-h-[40px] items-center justify-center gap-2 bg-danger-red text-[13px] font-[600] hover:bg-danger-red/90"
          >
            <Trash2 size={16} aria-hidden />
            Delete connection
          </PrimaryButton>
        </div>
      ) : null}
    </div>
  );
}
