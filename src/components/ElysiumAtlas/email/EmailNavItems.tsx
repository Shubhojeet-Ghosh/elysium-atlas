"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Inbox, Mail, Route, Users, Workflow } from "lucide-react";
import Badge from "@/components/ui/Badge";
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
  {
    name: "Smart Routing",
    href: "/email/routing-rules",
    icon: Route,
    showStarsIcon: true,
  },
  {
    name: "Smart Recipients",
    href: "/email/recipient-rules",
    icon: Users,
    showStarsIcon: true,
  },
  {
    name: "Workflows",
    href: "/email/workflows",
    icon: Workflow,
    badge: "Beta",
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
              <span className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-sm font-medium truncate">{item.name}</span>
                {"showStarsIcon" in item && item.showStarsIcon ? (
                  <img
                    src="/stars.svg"
                    alt=""
                    aria-hidden
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isActive ? "brightness-0 invert" : "opacity-80"
                    }`}
                  />
                ) : null}
                {"badge" in item && item.badge ? (
                  <Badge
                    className={`uppercase tracking-wide ${
                      isActive ? "bg-white/20 text-white" : ""
                    }`}
                  >
                    {item.badge}
                  </Badge>
                ) : null}
              </span>
            )}
          </Link>
        );

        if (isCollapsed) {
          return (
            <Tooltip key={item.name}>
              <TooltipTrigger asChild>{itemContent}</TooltipTrigger>
              <TooltipContent side="right">
                {"badge" in item && item.badge
                  ? `${item.name} (${item.badge})`
                  : item.name}
              </TooltipContent>
            </Tooltip>
          );
        }

        return <div key={item.name}>{itemContent}</div>;
      })}
    </nav>
  );
}
