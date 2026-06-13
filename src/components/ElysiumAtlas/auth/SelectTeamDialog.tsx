"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import Spinner from "@/components/ui/Spinner";
import { useAppDispatch, useAppSelector } from "@/store";
import { selectAuthTeam } from "@/utils/authApi";
import {
  applyLoginToStore,
  clearTeamSelectionPending,
  getTeamSelectionPending,
  getTeamSelectionRedirectPath,
} from "@/utils/authLogin";
import { getRedirectUrl } from "@/utils/redirectUtils";
import {
  clearTeamSelection,
  setTeamSelectionPending,
} from "@/store/reducers/teamsSlice";
import type { UserTeam } from "@/types/auth";
import { ChevronRight } from "lucide-react";

function getWorkspaceName(team: UserTeam): string {
  return team.team_name?.trim() || "Unnamed workspace";
}

function getWorkspaceInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "W";
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

function getGreeting(firstName: string, lastName: string): string {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  return name ? `Welcome back, ${name}` : "Select a workspace to continue";
}

function getTeamRoleLabel(team: UserTeam): string {
  if (team.role) {
    return team.role.charAt(0).toUpperCase() + team.role.slice(1);
  }
  return team.is_owner ? "Owner" : "Member";
}

export default function SelectTeamDialog() {
  const dispatch = useAppDispatch();
  const pending = useAppSelector((state) => state.teams.selectionPending);
  const redirectPath = useAppSelector(
    (state) => state.teams.selectionRedirectPath,
  );

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (pending) return;

    const stored = getTeamSelectionPending();
    if (!stored) return;

    dispatch(
      setTeamSelectionPending({
        pending: stored,
        redirectPath: getTeamSelectionRedirectPath() || getRedirectUrl(),
      }),
    );
  }, [dispatch, pending]);

  if (!pending) {
    return null;
  }

  const handleGoBack = () => {
    clearTeamSelectionPending();
    dispatch(clearTeamSelection());
  };

  const handleSelectTeam = async (teamId: string) => {
    if (isSubmitting) return;

    setSelectedTeamId(teamId);
    setIsSubmitting(true);

    try {
      const response = await selectAuthTeam(pending.selection_token, teamId);

      if (
        !response.success ||
        !response.sessionToken ||
        !response.user?.team_id
      ) {
        const message =
          response.message || "Unable to sign in with that team.";
        toast.error(message, { position: "top-center" });

        if (
          message.toLowerCase().includes("invalid") ||
          message.toLowerCase().includes("expired")
        ) {
          clearTeamSelectionPending();
          dispatch(clearTeamSelection());
          setTimeout(() => {
            window.location.href = "/auth/login";
          }, 1500);
        }
        return;
      }

      applyLoginToStore(dispatch, {
        sessionToken: response.sessionToken,
        teams: response.teams ?? pending.teams,
        user: response.user,
        is_profile_complete:
          response.is_profile_complete ?? pending.is_profile_complete,
      });
      clearTeamSelectionPending();
      dispatch(clearTeamSelection());

      window.location.href = redirectPath || "/my-agents";
    } catch {
      toast.error("We are facing some issues, please try again later", {
        position: "top-center",
      });
    } finally {
      setIsSubmitting(false);
      setSelectedTeamId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
      <div className="relative w-full max-w-sm mx-4 bg-pure-mist dark:bg-black rounded-lg shadow-lg">
        <div className="p-5">
          <p className="text-[15px] font-bold text-center text-deep-onyx dark:text-pure-mist mb-1">
            {getGreeting(pending.user.first_name, pending.user.last_name)}
          </p>
          <p className="text-[13px] text-center text-gray600 dark:text-gray500 mb-5">
            Select the workspace you&apos;d like to open.
          </p>

          <ul className="flex flex-col gap-2.5">
            {pending.teams.map((team) => {
              const isLoading = isSubmitting && selectedTeamId === team.team_id;
              const workspaceName = getWorkspaceName(team);
              const initials = getWorkspaceInitials(workspaceName);

              return (
                <li key={team.team_id}>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleSelectTeam(team.team_id)}
                    className="group w-full rounded-xl border border-gray-200 dark:border-white/20 bg-white dark:bg-deep-onyx px-3.5 py-3 text-left transition-all duration-200 hover:border-serene-purple hover:shadow-sm hover:bg-serene-purple/3 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-serene-purple/10 text-serene-purple dark:bg-serene-purple/20 dark:text-pure-mist">
                        <span className="text-[12px] font-semibold leading-none">
                          {initials}
                        </span>
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium text-deep-onyx dark:text-pure-mist">
                          {workspaceName}
                        </span>
                        <span
                          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            team.is_owner
                              ? "bg-serene-purple/10 text-serene-purple dark:bg-serene-purple/25 dark:text-pure-mist"
                              : "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400"
                          }`}
                        >
                          {getTeamRoleLabel(team)}
                        </span>
                      </span>

                      {isLoading ? (
                        <Spinner className="border-deep-onyx dark:border-pure-mist shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-serene-purple dark:text-gray-500 dark:group-hover:text-serene-purple" />
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="text-[13px] text-center text-gray600 dark:text-gray500 mt-6">
            Wrong account?{" "}
            <Link
              href="/auth/login"
              className="text-ecnavy dark:text-pure-mist hover:underline"
              onClick={(e) => {
                e.preventDefault();
                handleGoBack();
              }}
            >
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
