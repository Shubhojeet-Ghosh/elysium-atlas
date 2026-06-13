"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import { toast } from "sonner";
import Logo from "@/components/ElysiumAtlas/LogoComponent";
import ThemeToggle from "@/components/ElysiumAtlas/ThemeToggle";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Spinner from "@/components/ui/Spinner";
import {
  previewTeamInvitation,
  respondToTeamInvitation,
} from "@/utils/teamApi";
import type {
  InvitationPreview,
  PreviewResponse,
  RespondResponse,
} from "@/types/teamMembers";
import {
  getPreviewErrorMessage,
  getRespondErrorMessage,
  getRespondSuccessMessage,
} from "@/utils/teamInviteRespondMessages";
import { formatDate } from "@/utils/formatDate";

type PagePhase = "loading" | "error" | "pending" | "result";

function getPersonName(first: string, last: string): string {
  return [first, last].filter(Boolean).join(" ").trim();
}

function formatRoleLabel(role: string): string {
  if (!role) return "Member";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function TeamInviteRespondContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [phase, setPhase] = useState<PagePhase>(token ? "loading" : "error");
  const [invitation, setInvitation] = useState<InvitationPreview | null>(null);
  const [errorMessage, setErrorMessage] = useState(
    token ? "" : "Invalid invitation link.",
  );
  const [resultMessage, setResultMessage] = useState("");
  const [resultIsSuccess, setResultIsSuccess] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(Boolean(Cookies.get("elysium_atlas_session_token")));
  }, []);

  const loadPreview = useCallback(async (inviteToken: string) => {
    setPhase("loading");
    setErrorMessage("");
    setInvitation(null);

    try {
      const response = await previewTeamInvitation(inviteToken);

      if (response.success && response.invitation) {
        setInvitation(response.invitation);
        setPhase("pending");
        return;
      }

      setErrorMessage(getPreviewErrorMessage(response));
      setPhase("error");
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: PreviewResponse };
        message?: string;
      };
      const data = err.response?.data;
      setErrorMessage(
        data
          ? getPreviewErrorMessage(data)
          : err.message || "Unable to load this invitation.",
      );
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    loadPreview(token);
  }, [token, loadPreview]);

  const handleRespond = async (accept: boolean) => {
    if (!token) return;

    setIsResponding(true);
    try {
      const response = await respondToTeamInvitation(token, accept);

      if (response.success) {
        const message = getRespondSuccessMessage(response, accept);
        setResultMessage(message);
        setResultIsSuccess(true);
        setPhase("result");
        toast.success(message);
        return;
      }

      const message = getRespondErrorMessage(response);
      setResultMessage(message);
      setResultIsSuccess(false);
      setPhase("result");
      toast.error(message);
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: RespondResponse };
        message?: string;
      };
      const data = err.response?.data;
      const message = data
        ? getRespondErrorMessage(data)
        : err.message || "Unable to process invitation.";
      setResultMessage(message);
      setResultIsSuccess(false);
      setPhase("result");
      toast.error(message);
    } finally {
      setIsResponding(false);
    }
  };

  const inviterName = invitation
    ? getPersonName(
        invitation.inviter.first_name,
        invitation.inviter.last_name,
      ) || invitation.inviter.email
    : "";
  const teamName = invitation?.team_name || "this team";

  const resultHref =
    resultIsSuccess || isLoggedIn ? "/my-agents" : "/auth/login";
  const resultLabel =
    resultIsSuccess || isLoggedIn ? "Go to dashboard" : "Go to login";

  return (
    <div className="relative min-h-dvh w-full">
      <div className="flex flex-row items-center justify-between w-full px-[18px] py-[10px]">
        <Logo />
        <ThemeToggle />
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-4">
        <div className="mx-auto w-full max-w-[440px] p-6 sm:p-8">
          {phase === "loading" && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Spinner className="border-serene-purple dark:border-pure-mist w-6 h-6" />
              <p className="text-[14px] font-semibold text-deep-onyx dark:text-pure-mist">
                Loading invitation...
              </p>
            </div>
          )}

          {phase === "error" && (
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <p className="text-[15px] font-semibold text-deep-onyx dark:text-pure-mist">
                Invitation unavailable
              </p>
              <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed">
                {errorMessage}
              </p>
              <Link href={isLoggedIn ? "/my-agents" : "/auth/login"}>
                <PrimaryButton className="text-[13px] min-w-[120px]">
                  {isLoggedIn ? "Go to dashboard" : "Go to login"}
                </PrimaryButton>
              </Link>
            </div>
          )}

          {phase === "pending" && invitation && (
            <div className="flex flex-col gap-5">
              <div className="text-center">
                <p className="text-[16px] font-bold text-deep-onyx dark:text-pure-mist leading-snug">
                  {inviterName} invited you to join {teamName}
                </p>
                <p className="text-[13px] text-gray-600 dark:text-gray-400 mt-2">
                  Invitation for{" "}
                  <span className="font-semibold text-deep-onyx dark:text-pure-mist">
                    {invitation.invitee.email}
                  </span>
                </p>
                <p className="text-[13px] text-gray-600 dark:text-gray-400 mt-1">
                  Role:{" "}
                  <span className="font-semibold text-deep-onyx dark:text-pure-mist">
                    {formatRoleLabel(invitation.role)}
                  </span>
                </p>
                <p className="text-[12px] text-gray-500 dark:text-gray-500 mt-1">
                  Expires {formatDate(invitation.expires_at)}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 sm:justify-center">
                <PrimaryButton
                  className="text-[13px] font-semibold min-h-[40px] flex-1 sm:flex-none sm:min-w-[130px] bg-danger-red hover:bg-danger-red/90 text-white"
                  onClick={() => handleRespond(false)}
                  disabled={isResponding}
                >
                  Decline
                </PrimaryButton>
                <PrimaryButton
                  className="text-[13px] font-semibold min-h-[40px] flex-1 sm:flex-none sm:min-w-[130px]"
                  onClick={() => handleRespond(true)}
                  disabled={isResponding}
                >
                  {isResponding ? (
                    <Spinner className="border-white dark:border-deep-onyx" />
                  ) : (
                    "Accept"
                  )}
                </PrimaryButton>
              </div>
            </div>
          )}

          {phase === "result" && (
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <p className="text-[15px] font-semibold text-deep-onyx dark:text-pure-mist">
                {resultIsSuccess ? "All set" : "Unable to complete"}
              </p>
              <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed">
                {resultMessage}
              </p>
              <Link href={resultHref}>
                <PrimaryButton className="text-[13px] min-w-[140px]">
                  {resultLabel}
                </PrimaryButton>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TeamInviteRespond() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-dvh">
          <Spinner className="border-serene-purple w-6 h-6" />
        </div>
      }
    >
      <TeamInviteRespondContent />
    </Suspense>
  );
}
