"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Home, Settings, Users, FileText, BarChart3 } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  {
    name: "My Agents",
    href: "/my-agents",
    icon: Bot,
  },
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    disabled: true,
  },
  {
    name: "Team",
    href: "/team",
    icon: Users,
    disabled: true,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    disabled: true,
  },
];

interface NavItemsProps {
  isCollapsed: boolean;
}

export default function NavItems({ isCollapsed }: NavItemsProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2 w-full mt-6">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href === "/my-agents" && pathname.startsWith("/my-agents"));

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
            href={item.href}
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

        if (isCollapsed) {
          return (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>{itemContent}</TooltipTrigger>
              <TooltipContent side="right">{tooltipLabel}</TooltipContent>
            </Tooltip>
          );
        }

        if (item.disabled) {
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
