"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCanManageAgents } from "@/hooks/useCanManageAgents";

export default function BuildAgentAccessGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const canManageAgents = useCanManageAgents();

  useEffect(() => {
    if (!canManageAgents) {
      toast.error("You don't have permission to create agents.");
      router.replace("/my-agents");
    }
  }, [canManageAgents, router]);

  if (!canManageAgents) {
    return null;
  }

  return <>{children}</>;
}
