"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Inbox, Mail } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const navItems = [
  {
    name: "AI Agents",
    href: "/email/ai-agents",
    icon: Bot,
  },
  {
    name: "Inbox Integration",
    href: "/email/inbox-settings",
    icon: Inbox,
  },
  {
    name: "Inbox",
    href: "/email/inbox",
    icon: Mail,
  },
] as const;

interface EmailNavItemsProps {
  isCollapsed: boolean;
}

export default function EmailNavItems({ isCollapsed }: EmailNavItemsProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2 w-full mt-6">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        const itemContent = (
          <Link
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
              ${
                isActive
                  ? "bg-serene-purple text-white"
                  : "text-gray-700 hover:bg-serene-purple/10 hover:text-serene-purple"
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

        if (isCollapsed) {
          return (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>{itemContent}</TooltipTrigger>
              <TooltipContent side="right">{item.name}</TooltipContent>
            </Tooltip>
          );
        }

        return <div key={item.name}>{itemContent}</div>;
      })}
    </nav>
  );
}
