import type { PreviewResponse, RespondResponse } from "@/types/teamMembers";

export function getPreviewErrorMessage(response: PreviewResponse): string {
  const message = response.message ?? "";
  const status = response.invitation_status;

  if (message === "Token is required.") {
    return "Invalid invitation link.";
  }
  if (message === "Invalid or expired invitation.") {
    return "This invitation link is invalid or has expired.";
  }
  if (message === "This invitation is no longer valid.") {
    return "This invitation is no longer valid.";
  }
  if (message === "This invitation is no longer available.") {
    if (status === "accepted") {
      return "You have already responded to this invitation.";
    }
    if (status === "declined") {
      return "This invitation was declined.";
    }
    if (status === "pending") {
      return "This invitation has expired. Ask the team owner to send a new one.";
    }
    return "This invitation is no longer available.";
  }
  if (message === "Server error.") {
    return "Something went wrong. Please try again later.";
  }

  return message || "Unable to load this invitation.";
}

export function getRespondSuccessMessage(
  response: RespondResponse,
  accepted: boolean,
): string {
  if (!accepted) {
    return "You declined the invitation.";
  }

  const teamName = response.membership?.team_name;
  const message = response.message ?? "";

  if (message.toLowerCase().includes("already a member")) {
    return teamName
      ? `You are already a member of ${teamName}.`
      : "You are already a member of this team.";
  }

  if (response.membership) {
    return teamName
      ? `Welcome! You joined ${teamName}.`
      : "You have joined the team.";
  }

  return message || "Invitation processed successfully.";
}

export function getRespondErrorMessage(response: RespondResponse): string {
  const message = response.message ?? "";
  const status = response.invitation_status;

  if (message === "Token is required.") {
    return "Invalid invitation link.";
  }
  if (message === "Invalid or expired invitation.") {
    return "This invitation link is invalid or has expired.";
  }
  if (message === "This invitation is no longer available.") {
    if (status === "accepted") {
      return "You have already responded to this invitation.";
    }
    if (status === "declined") {
      return "This invitation was declined.";
    }
    if (status === "expired" || status === "pending") {
      return "This invitation has expired. Ask the team owner to send a new one.";
    }
    return "This invitation is no longer available.";
  }
  if (message === "This team is no longer available.") {
    return "This team is no longer available.";
  }
  if (message === "Your account is not eligible to join this team.") {
    return "Your account is not eligible to join this team.";
  }
  if (message === "Team is full.") {
    return "This team is full. Ask the owner to upgrade their plan or free up a spot.";
  }
  if (message === "Unable to process invitation.") {
    return "Unable to process invitation. Please try again.";
  }

  return message || "Unable to process invitation.";
}
