import { CheckCheck, Copy } from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import OutlineButton from "@/components/ui/OutlineButton";
import { useAppDispatch, useAppSelector } from "@/store";
import { resetAgentChat } from "@/store/reducers/agentChatSlice";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

export default function AgentReadyCard() {
  const dispatch = useAppDispatch();
  const agentID = useAppSelector((state) => state.agent.agentID);

  const handlePreview = () => {
    // Reset chat state before opening preview
    dispatch(resetAgentChat());

    const chatSessionId = "app-" + uuidv4();
    const url = `/chat-with-agent?agent_id=${agentID}&chat_session_id=${chatSessionId}`;
    window.open(url, "_blank");
  };

  const handleCopyLink = async () => {
    try {
      const baseUrl = window.location.origin;
      const agentUrl = `${baseUrl}/chat-with-agent?agent_id=${agentID}`;

      await navigator.clipboard.writeText(agentUrl);
      toast.success("Link to the agent has been copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link to clipboard");
    }
  };

  return (
    <div className="lg:max-w-[340px] lg:w-full md:max-w-[340px] md:w-full w-full min-h-[180px] bg-gradient-to-br from-serene-purple/50 to-serene-purple/30 rounded-[20px] px-[24px] py-[20px]  shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-3 mb-4">
        <div className="rounded-full p-[12px] bg-gradient-to-br from-pure-mist to-white flex items-center justify-center shadow-sm">
          <CheckCheck className="text-serene-purple" size={18} />
        </div>

        <div className="flex-1">
          <p className="text-[17px] font-[700] text-deep-onyx dark:text-pure-mist mb-1">
            Agent is ready
          </p>
          <p className="text-[13px] font-[500] text-deep-onyx dark:text-pure-mist leading-relaxed">
            Agent is now live and ready to engage. Try it now.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <OutlineButton
          className="text-[13px] font-[500] text-serene-purple font-[600]"
          onClick={handleCopyLink}
        >
          <Copy size={14} className="mr-2" />
          Get Link
        </OutlineButton>
        <PrimaryButton
          className="py-[12px] text-[13px] font-[500]"
          onClick={handlePreview}
        >
          Try it now
        </PrimaryButton>
      </div>
    </div>
  );
}
