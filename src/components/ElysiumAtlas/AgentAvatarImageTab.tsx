"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { downsampleImage } from "@/utils/downsampleImage";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  setAgentIcon,
  setTriggerGetAgentDetails,
} from "@/store/reducers/agentSlice";
import Cookies from "js-cookie";
import { toast } from "sonner";
import fastApiAxios from "@/utils/fastapi_axios";
import { Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import PrimaryButton from "@/components/ui/PrimaryButton";

interface AgentAvatarImageTabProps {
  preview: string | null;
  setPreview: (dataUrl: string | null) => void;
  avatarFile: File | null;
  setAvatarFile: (file: File | null) => void;
}

export default function AgentAvatarImageTab({
  preview,
  setPreview,
  avatarFile,
  setAvatarFile,
}: AgentAvatarImageTabProps) {
  const dispatch = useAppDispatch();
  const agentIcon = useAppSelector((state) => state.agent.agent_icon);
  const agentID = useAppSelector((state) => state.agent.agentID);
  const triggerGetAgentDetails = useAppSelector(
    (state) => state.agent.triggerGetAgentDetails,
  );

  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const objectUrl = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        const dataUrl = downsampleImage(img, 192);
        setPreview(dataUrl);
        setAvatarFile(file);
        dispatch(setAgentIcon(dataUrl));
        URL.revokeObjectURL(objectUrl);
      };
      img.src = objectUrl;
    },
    [dispatch, setPreview, setAvatarFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"] },
    maxSize: 2 * 1024 * 1024,
    multiple: false,
  });

  const handleClear = async () => {
    setIsRemoving(true);
    setPreview(null);
    setAvatarFile(null);
    dispatch(setAgentIcon(null));
    setRemoveDialogOpen(false);

    if (!agentID) {
      setIsRemoving(false);
      return;
    }

    try {
      const token = Cookies.get("elysium_atlas_session_token");
      const response = await fastApiAxios.post(
        "/elysium-agents/elysium-atlas/agent/v1/update-agent",
        { agent_id: agentID, agent_icon: null },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.data.success) {
        // Re-fetch agent details so mappedInitial updates and UnsavedChangesBar clears
        dispatch(setTriggerGetAgentDetails(triggerGetAgentDetails + 1));
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to remove avatar",
      );
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="w-full max-w-[480px] flex flex-col gap-[12px]">
      {/* Current icon preview (from Redux / previous upload) */}
      {(preview || agentIcon) && (
        <div className="flex flex-row items-center gap-[12px] border border-border rounded-[12px] p-[12px]">
          <div className="shrink-0 w-[44px] h-[44px] rounded-full overflow-hidden bg-muted">
            <Image
              src={(preview || agentIcon)!}
              alt="Current avatar"
              width={44}
              height={44}
              className="w-[44px] h-[44px] object-cover rounded-full"
              quality={100}
              unoptimized={(preview || agentIcon)!.startsWith("data:")}
            />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <p className="text-[12px] font-[600]">Current avatar</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {(preview || agentIcon)!.startsWith("data:")
                ? "Uploaded image"
                : preview || agentIcon}
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Dialog
                open={removeDialogOpen}
                onOpenChange={setRemoveDialogOpen}
              >
                <DialogTrigger asChild>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="group/btn shrink-0 p-[6px] rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                  >
                    <Trash2
                      size={14}
                      className="text-muted-foreground group-hover/btn:text-danger-red transition-colors"
                    />
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Remove Agent Avatar</DialogTitle>
                    <DialogDescription>
                      This will permanently remove your agent&apos;s avatar.
                      This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <PrimaryButton className="bg-transparent border border-gray-300 dark:border-white text-gray-700 dark:text-white text-[12px] hover:bg-white dark:hover:bg-pure-mist dark:hover:text-deep-onyx">
                        Cancel
                      </PrimaryButton>
                    </DialogClose>
                    <PrimaryButton
                      className="text-[12px] font-semibold bg-danger-red hover:bg-danger-red/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleClear}
                      disabled={isRemoving}
                    >
                      {isRemoving ? "Removing..." : "Remove"}
                    </PrimaryButton>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TooltipTrigger>
            <TooltipContent>
              <p>Remove agent avatar</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`flex flex-row items-center gap-[16px] w-full border rounded-[12px] p-[16px] cursor-pointer transition-colors duration-200 ${
          isDragActive
            ? "border-serene-purple bg-serene-purple/5"
            : "border-border hover:border-serene-purple/50"
        }`}
      >
        <input {...getInputProps()} />

        {/* Avatar preview circle */}
        <div className="shrink-0 w-[52px] h-[52px] rounded-full bg-muted overflow-hidden flex items-center justify-center">
          {preview ? (
            <Image
              src={preview}
              alt="Avatar preview"
              width={52}
              height={52}
              className="w-[52px] h-[52px] object-cover rounded-full"
              quality={100}
              unoptimized={preview.startsWith("data:")}
            />
          ) : (
            <div className="w-full h-full bg-muted" />
          )}
        </div>

        {/* Text */}
        <div className="flex flex-col gap-[4px]">
          <p className="text-[13px] font-[600]">
            Click or drag a file to upload
          </p>
          <p className="text-[12px] text-muted-foreground">
            Recommended resolution: 192 × 192 pixels.
          </p>
          <p className="text-[12px] text-muted-foreground">
            Maximum size: 2MB.
          </p>
        </div>
      </div>
    </div>
  );
}
