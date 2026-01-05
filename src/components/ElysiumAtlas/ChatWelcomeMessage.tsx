import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useAppSelector } from "@/store";
import Image from "next/image";

interface ChatWelcomeMessageProps {
  handleSendMessage: (message?: string) => void;
  setInputValue: (value: string) => void;
}

const ChatWelcomeMessage: React.FC<ChatWelcomeMessageProps> = ({
  handleSendMessage,
  setInputValue,
}) => {
  const {
    agent_icon,
    welcome_message,
    quick_prompts,
    agent_name,
    primary_color,
    text_color,
  } = useAppSelector((state) => state.agentChat);

  return (
    <div className="flex pl-[18px] pr-[16px] h-full min-h-[200px] py-[10px]">
      <div className="text-start max-w-md space-y-4">
        {agent_icon ? (
          <div className="flex">
            <Image
              src={agent_icon}
              alt="Agent Icon"
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover"
              quality={100}
            />
          </div>
        ) : (
          <div
            className="w-16 h-16 rounded-full bg-black flex items-center justify-center text-white font-semibold text-lg shadow-sm"
            style={{ backgroundColor: primary_color, color: text_color }}
          >
            {agent_name?.charAt(0)?.toUpperCase() || "A"}
          </div>
        )}
        <div className="text-[14px] text-gray-800 leading-relaxed font-[600]">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {welcome_message}
          </ReactMarkdown>
        </div>
        {quick_prompts && quick_prompts.length > 0 && (
          <div className="space-y-2">
            {quick_prompts.map((prompt: any) => (
              <button
                key={prompt.id}
                className="w-full text-left py-[10px] text-[13px] text-gray-600 cursor-pointer font-[500] hover:bg-gray-100 px-[12px] rounded-md"
                onClick={() => {
                  handleSendMessage(prompt.prompt);
                }}
              >
                {prompt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWelcomeMessage;
