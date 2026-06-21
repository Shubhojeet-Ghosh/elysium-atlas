"use client";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  Settings,
  Database,
  Palette,
  Radio,
  UserRoundCheck,
  UserPlus,
  Shield,
  Users,
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { resolveSection } from "@/utils/agentSectionUtils";

interface AgentNavItem {
  name: string;
  slug: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  hrefSuffix: string;
}

const agentNavItems: AgentNavItem[] = [
  {
    name: "General",
    slug: "general",
    icon: Settings,
    hrefSuffix: "?section=general",
  },
  {
    name: "Personalize",
    slug: "personalize",
    icon: Palette,
    hrefSuffix: "?section=personalize",
  },
  {
    name: "Data Source",
    slug: "data-source",
    icon: Database,
    hrefSuffix: "?section=data-source&activeTab=links",
  },
  {
    name: "Live Visitors",
    slug: "live-visitors",
    icon: Radio,
    hrefSuffix: "?section=live-visitors",
  },
  {
    name: "Lead Collection",
    slug: "lead-collection",
    icon: UserRoundCheck,
    disabled: true,
    hrefSuffix: "",
  },
  {
    name: "Human Handover",
    slug: "human-handover",
    icon: UserPlus,
    disabled: true,
    hrefSuffix: "",
  },
  {
    name: "Security",
    slug: "security",
    icon: Shield,
    disabled: true,
    hrefSuffix: "",
  },
  {
    name: "Team",
    slug: "team",
    icon: Users,
    disabled: true,
    hrefSuffix: "",
  },
  {
    name: "Advanced",
    slug: "advanced",
    icon: Settings,
    disabled: true,
    hrefSuffix: "",
  },
];

interface AgentNavItemsProps {
  isCollapsed: boolean;
  onNavigate?: () => void;
  onCloseNav?: () => void;
}

export default function AgentNavItems({
  isCollapsed,
  onNavigate,
  onCloseNav,
}: AgentNavItemsProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const agentID = params.agentID as string;
  const section = resolveSection(searchParams);

  return (
    <nav className="flex flex-col gap-2 w-full mt-6">
      {agentNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = !item.disabled && section === item.slug;
        const href = `/my-agents/${agentID}${item.hrefSuffix}`;

        const itemContent = item.disabled ? (
          <span
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-not-allowed
              text-gray-700 dark:text-gray-300
              ${isCollapsed ? "justify-center" : ""}
            `}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && (
              <span className="text-sm font-medium truncate">{item.name}</span>
            )}
          </span>
        ) : (
          <Link
            href={href}
            onClick={() => {
              if (isActive) {
                onCloseNav?.();
              } else {
                onNavigate?.();
              }
            }}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
              ${
                isActive
                  ? "bg-serene-purple text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-serene-purple/10 dark:hover:bg-serene-purple/20 hover:text-serene-purple dark:hover:text-serene-purple"
              }
              ${isCollapsed ? "justify-center" : ""}
            `}
          >
            <Icon
              className={`w-5 h-5 flex-shrink-0 ${
                isActive ? "text-white" : ""
              }`}
            />
            {!isCollapsed && (
              <span className="text-sm font-medium truncate">{item.name}</span>
            )}
          </Link>
        );

        const tooltipLabel = item.disabled ? "Coming Soon" : item.name;

        if (isCollapsed || item.disabled) {
          return (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>{itemContent}</TooltipTrigger>
              <TooltipContent side="right">{tooltipLabel}</TooltipContent>
            </Tooltip>
          );
        }

        return <div key={item.name}>{itemContent}</div>;
      })}
    </nav>
  );
}
