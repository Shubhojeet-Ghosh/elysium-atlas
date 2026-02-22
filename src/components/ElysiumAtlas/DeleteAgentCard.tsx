"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "sonner";
import { useAppSelector } from "@/store";
import fastApiAxios from "@/utils/fastapi_axios";
import PrimaryButton from "@/components/ui/PrimaryButton";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DeleteAgentCard() {
  const agentID = useAppSelector((state) => state.agent.agentID);
  const agentName = useAppSelector((state) => state.agent.agentName);
  const router = useRouter();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!agentID) return;
    setIsLoading(true);
    const token = Cookies.get("elysium_atlas_session_token");
    try {
      const response = await fastApiAxios.post(
        "/elysium-agents/elysium-atlas/agent/v1/delete-agent",
        { agent_id: agentID },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.data.success === true) {
        toast.success("Agent deleted successfully!");
        router.push("/my-agents");
      } else {
        toast.error(response.data.message || "Failed to delete agent");
        setIsLoading(false);
        setDialogOpen(false);
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete agent. Please try again.";
      toast.error(msg);
      setIsLoading(false);
      setDialogOpen(false);
    }
  };

  return (
    <>
      <div className="lg:max-w-[340px] lg:w-full md:max-w-[340px] md:w-full w-full min-h-[180px] bg-linear-to-br from-danger-red/30 to-danger-red/20 rounded-[20px] px-6 py-5 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex items-start gap-3 mb-4">
          <div className="rounded-full p-3 bg-linear-to-br from-pure-mist to-white flex items-center justify-center shadow-sm shrink-0">
            <Trash2 className="text-danger-red" size={18} />
          </div>

          <div className="flex-1">
            <p className="text-[17px] font-bold text-deep-onyx dark:text-pure-mist mb-1">
              Delete this agent
            </p>
            <p className="text-[13px] font-medium text-deep-onyx dark:text-pure-mist leading-relaxed">
              Permanently remove{agentName ? ` "${agentName}"` : " this agent"}{" "}
              and all associated knowledge base data. This action cannot be
              undone.
            </p>
          </div>
        </div>

        <PrimaryButton
          className="w-full text-[13px] py-[11px] bg-danger-red hover:bg-danger-red/90 border-none"
          onClick={() => setDialogOpen(true)}
        >
          Delete Agent
        </PrimaryButton>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Agent</DialogTitle>
            <DialogDescription>
              This will permanently delete{" "}
              {agentName ? `"${agentName}"` : "this agent"} and all associated
              knowledge base data. This action cannot be undone.
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
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Confirm"}
            </PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
