import { ChevronRight } from "lucide-react";

interface CustomSelectorProps {
  label: string;
  value: string;
  className?: string;
  onClick?: () => void;
}

const CustomSelector = ({
  label,
  value,
  className,
  onClick,
}: CustomSelectorProps) => (
  <div
    className={`border-gray-300 dark:border-deep-onyx font-[600] border-[2px] rounded-[10px] px-2 py-[6px] bg-white dark:bg-deep-onyx flex justify-between items-center text-[12px] cursor-pointer hover:bg-serene-purple/10 dark:hover:bg-serene-purple/10 transition-all duration-300 ${
      className || ""
    }`}
    onClick={onClick}
  >
    <span>{value || `Select ${label}`}</span>
    <ChevronRight className="w-4 h-4 text-gray-400" />
  </div>
);

export default CustomSelector;
