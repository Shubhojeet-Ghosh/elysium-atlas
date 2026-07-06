import Badge from "@/components/ui/Badge";
import type { SessionLeadListStatus } from "@/types/leadCollection";

interface LeadStatusBadgeProps {
  status: Exclude<SessionLeadListStatus, null>;
}

export default function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  if (status === "complete") {
    return (
      <Badge className="bg-serene-purple text-white">Lead Collected</Badge>
    );
  }

  return (
    <Badge className="bg-teal-green text-white">Partial Lead</Badge>
  );
}
