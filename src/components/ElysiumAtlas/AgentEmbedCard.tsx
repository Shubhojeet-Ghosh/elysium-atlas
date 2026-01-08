import { Code, Copy } from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import CustomInput from "@/components/inputs/CustomInput";
import { useAppSelector } from "@/store";
import { toast } from "sonner";

export default function AgentEmbedCard() {
  const widgetScript = useAppSelector((state) => state.agent.widget_script);

  const handleCopyWidgetScript = async () => {
    try {
      if (widgetScript) {
        await navigator.clipboard.writeText(widgetScript);
        toast.success("Widget script has been copied to clipboard!");
      }
    } catch (error) {
      toast.error("Failed to copy widget script to clipboard");
    }
  };

  return (
    <div className="lg:max-w-[340px] lg:w-full md:max-w-[340px] md:w-full w-full min-h-[180px] bg-gradient-to-br from-serene-purple/50 to-serene-purple/30 rounded-[20px] px-[24px] py-[20px] shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-3 mb-4">
        <div className="rounded-full p-[12px] bg-gradient-to-br from-pure-mist to-white flex items-center justify-center shadow-sm">
          <Code className="text-serene-purple" size={18} />
        </div>

        <div className="flex-1">
          <p className="text-[17px] font-[700] text-deep-onyx dark:text-pure-mist mb-1">
            Embed this agent
          </p>
          <p className="text-[13px] font-[500] text-deep-onyx dark:text-pure-mist leading-relaxed">
            Copy this code below and paste it into your website code to embed
            the agent chat widget.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <CustomInput
          type="text"
          value={widgetScript || ""}
          readOnly
          placeholder="Widget script will appear here..."
          className="flex-1 py-[11px]"
          inputClassName="text-[12px] font-mono"
        />
        <PrimaryButton
          className="text-[13px] py-[12px]"
          onClick={handleCopyWidgetScript}
        >
          <Copy size={14} />
        </PrimaryButton>
      </div>
    </div>
  );
}
