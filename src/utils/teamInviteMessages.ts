import type { InviteEmailStatus } from "@/types/teamMembers";

const DIALOG_STATUSES: InviteEmailStatus[] = [
  "not_registered",
  "profile_incomplete",
  "invalid_email",
  "self_invite",
  "team_full",
  "email_send_failed",
  "invitation_unavailable",
  "duplicate_in_request",
];

export function shouldShowInviteStatusInDialog(
  status: InviteEmailStatus,
): boolean {
  return DIALOG_STATUSES.includes(status);
}

export function getInviteStatusMessage(
  status: InviteEmailStatus,
  email: string,
): string {
  switch (status) {
    case "invited":
      return `Invitation sent to ${email}.`;
    case "already_invited":
      return `Invitation resent to ${email}.`;
    case "not_registered":
      return `No account found for ${email}. They need to sign up on Atlas before they can be invited.`;
    case "profile_incomplete":
      return `${email} has an account but has not completed their profile yet.`;
    case "already_member":
      return `${email} is already a team member.`;
    case "self_invite":
      return "You cannot invite your own email address.";
    case "invalid_email":
      return `Please enter a valid email address.`;
    case "duplicate_in_request":
      return `Duplicate email in this request: ${email}`;
    case "team_full":
      return "Your team is full. Upgrade your plan or wait for pending invites to expire.";
    case "email_send_failed":
      return `Could not send the invitation email to ${email}. Please try again.`;
    case "invitation_unavailable":
      return `Could not process the invitation for ${email}. Please try again.`;
    default:
      return "Unable to send invitation. Please try again.";
  }
}
