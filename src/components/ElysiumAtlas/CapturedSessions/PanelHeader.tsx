import { ChevronDown, ChevronUp } from "lucide-react";

interface PanelHeaderProps {
  expanded: boolean;
  onToggle: () => void;
}

export default function PanelHeader({ expanded, onToggle }: PanelHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#1b1b1b] cursor-pointer select-none"
      onClick={onToggle}
    >
      <div className="flex items-center gap-2">
        <span className="font-[600] text-[14px] text-deep-onyx dark:text-pure-mist">
          Messaging
        </span>
      </div>
      <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
        {expanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronUp className="w-4 h-4" />
        )}
      </div>
    </div>
  );
}
