"use client";

import { useMemo, useState, type ReactNode } from "react";
import Cookies from "js-cookie";
import { toast } from "sonner";
import CustomInput from "@/components/inputs/CustomInput";
import Spinner from "@/components/ui/Spinner";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  setFirstName,
  setLastName,
  setProfilePicture,
  setTeamRole,
} from "@/store/reducers/userProfileSlice";
import { setTeams } from "@/store/reducers/teamsSlice";
import { useActiveTeamRole } from "@/hooks/useActiveTeamRole";
import { updateAccountSettings } from "@/utils/accountApi";
import type { UserTeam } from "@/types/auth";

const DUMMY_CURRENT_PASSWORD = "********";
const FORM_MAX_WIDTH = "max-w-md lg:max-w-4xl";

const FIELD_LABEL_CLASS =
  "block text-[13px] font-medium text-deep-onyx dark:text-pure-mist mb-1 leading-5 min-h-[20px]";
const FIELD_INPUT_CLASS = "min-h-[45px]";
const FIELD_FOOTER_CLASS =
  "mt-2 flex min-h-[22px] items-center justify-end";
const SECTION_TITLE_CLASS =
  "text-[15px] font-semibold text-deep-onyx dark:text-pure-mist mb-1 leading-5 min-h-[20px]";
const SECTION_DESC_CLASS =
  "text-[13px] text-gray-500 dark:text-gray-400 leading-5 min-h-[20px]";

interface SettingsFieldProps {
  id: string;
  label: string;
  children: ReactNode;
  showPasswordToggle?: {
    checked: boolean;
    onChange: () => void;
    label: string;
  };
}

function SettingsField({
  id,
  label,
  children,
  showPasswordToggle,
}: SettingsFieldProps) {
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className={FIELD_LABEL_CLASS}>
        {label}
      </label>
      {children}
      <div className={FIELD_FOOTER_CLASS}>
        {showPasswordToggle ? (
          <label className="flex items-center gap-2 text-[13px] text-gray-600 dark:text-pure-mist select-none cursor-pointer">
            <input
              type="checkbox"
              checked={showPasswordToggle.checked}
              onChange={showPasswordToggle.onChange}
              className="accent-deep-onyx"
            />
            {showPasswordToggle.label}
          </label>
        ) : null}
      </div>
    </div>
  );
}

export default function AccountSettings() {
  const dispatch = useAppDispatch();
  const teamRole = useActiveTeamRole();
  const isOwner = teamRole === "owner";
  const isLeftNavOpen = useAppSelector(
    (state) => state.settings.isLeftNavOpen,
  );

  const storedFirstName = useAppSelector((state) => state.userProfile.firstName);
  const storedLastName = useAppSelector((state) => state.userProfile.lastName);
  const userEmail = useAppSelector((state) => state.userProfile.userEmail);
  const teamID = useAppSelector((state) => state.userProfile.teamID);
  const teams = useAppSelector((state) => state.teams.list);

  const activeTeam = teams.find((team: UserTeam) => team.team_id === teamID);
  const storedTeamName = activeTeam?.team_name?.trim() || "";

  const [firstName, setFirstNameValue] = useState(storedFirstName);
  const [lastName, setLastNameValue] = useState(storedLastName);
  const [teamName, setTeamName] = useState(storedTeamName);
  const [currentPassword, setCurrentPassword] = useState(
    DUMMY_CURRENT_PASSWORD,
  );
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCurrentPasswordDummy = currentPassword === DUMMY_CURRENT_PASSWORD;

  const hasProfileChanges = useMemo(
    () =>
      firstName.trim() !== storedFirstName.trim() ||
      lastName.trim() !== storedLastName.trim() ||
      teamName.trim() !== storedTeamName,
    [
      firstName,
      lastName,
      teamName,
      storedFirstName,
      storedLastName,
      storedTeamName,
    ],
  );

  const hasPasswordChange = useMemo(() => {
    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();
    const trimmedCurrent = isCurrentPasswordDummy
      ? ""
      : currentPassword.trim();
    return (
      trimmedCurrent.length > 0 ||
      trimmedNew.length > 0 ||
      trimmedConfirm.length > 0
    );
  }, [currentPassword, newPassword, confirmPassword, isCurrentPasswordDummy]);

  const hasChanges = hasProfileChanges || hasPasswordChange;

  const handleCurrentPasswordFocus = (
    e: React.FocusEvent<HTMLInputElement>,
  ) => {
    if (isCurrentPasswordDummy) {
      e.target.select();
    }
  };

  const handleCurrentPasswordBlur = () => {
    if (currentPassword.trim() === "") {
      setCurrentPassword(DUMMY_CURRENT_PASSWORD);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOwner) {
      toast.error("Only the team owner can update account settings.");
      return;
    }

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedTeamName = teamName.trim();
    const trimmedCurrentPassword = isCurrentPasswordDummy
      ? ""
      : currentPassword.trim();
    const trimmedNewPassword = newPassword.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!hasProfileChanges && !hasPasswordChange) {
      toast.error("No changes to save.");
      return;
    }

    if (hasProfileChanges) {
      if (!trimmedFirstName) {
        toast.error("First name cannot be empty.");
        return;
      }
      if (!trimmedTeamName) {
        toast.error("Team name cannot be empty.");
        return;
      }
    }

    if (hasPasswordChange) {
      if (!trimmedCurrentPassword) {
        toast.error("Current password is required to change your password.");
        return;
      }
      if (!trimmedNewPassword) {
        toast.error("New password is required.");
        return;
      }
      if (trimmedNewPassword.length < 8) {
        toast.error("New password must be at least 8 characters.");
        return;
      }
      if (!trimmedConfirmPassword) {
        toast.error("Please confirm your new password.");
        return;
      }
      if (trimmedNewPassword !== trimmedConfirmPassword) {
        toast.error("New passwords do not match.");
        return;
      }
    }

    const payload: Record<string, string> = {};

    if (trimmedFirstName !== storedFirstName.trim()) {
      payload.first_name = trimmedFirstName;
    }
    if (trimmedLastName !== storedLastName.trim()) {
      payload.last_name = trimmedLastName;
    }
    if (trimmedTeamName !== storedTeamName) {
      payload.team_name = trimmedTeamName;
    }
    if (hasPasswordChange) {
      payload.current_password = trimmedCurrentPassword;
      payload.password = trimmedNewPassword;
    }

    setIsSubmitting(true);

    try {
      const response = await updateAccountSettings(payload);

      if (!response.success) {
        toast.error(response.message || "Failed to update account settings.");
        return;
      }

      if (response.sessionToken) {
        Cookies.set("elysium_atlas_session_token", response.sessionToken, {
          path: "/",
          expires: 1,
        });
      }

      if (response.user) {
        dispatch(setFirstName(response.user.first_name || ""));
        dispatch(setLastName(response.user.last_name || ""));
        dispatch(setProfilePicture(response.user.profile_image_url || ""));
        dispatch(setTeamRole(response.user.role ?? null));

        if (response.user.team_name && teamID) {
          const updatedTeams = teams.map((team) =>
            team.team_id === teamID
              ? { ...team, team_name: response.user!.team_name }
              : team,
          );
          dispatch(setTeams(updatedTeams));
        }
      }

      setCurrentPassword(DUMMY_CURRENT_PASSWORD);
      setNewPassword("");
      setConfirmPassword("");

      toast.success(
        response.message || "Account settings updated successfully.",
      );
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };

      if (err.response?.status === 403) {
        toast.error(
          err.response?.data?.message ||
            "Only the team owner can update account settings.",
        );
        return;
      }

      toast.error(
        err.response?.data?.message ||
          err.message ||
          "We are facing some issues, please try again later.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className={`mx-auto w-full ${FORM_MAX_WIDTH} pb-28`}>
        <div className="lg:text-[22px] text-[18px] font-bold mb-1 text-left">
          Account Settings
        </div>
        {userEmail ? (
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-2 text-left">
            {userEmail}
          </p>
        ) : null}
        <p className="text-[13px] text-gray-500 dark:text-gray-400 mb-6 text-left">
          Update your profile, team name, and password.
        </p>

        {!isOwner ? (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100 text-left">
            Only the team owner can update account settings. Contact your team
            owner if you need changes.
          </div>
        ) : null}

        <form
          id="account-settings-form"
          onSubmit={handleSubmit}
          className={`mx-auto w-full ${FORM_MAX_WIDTH} text-left`}
        >
          <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-x-12 lg:gap-y-4">
            <div className="order-0 lg:col-start-1 lg:row-start-1">
              <h3 className={SECTION_TITLE_CLASS}>Profile Information</h3>
              <p className={SECTION_DESC_CLASS}>
                Update your name and team details.
              </p>
            </div>

            <div className="order-1 lg:col-start-1 lg:row-start-2">
              <SettingsField id="firstName" label="First Name">
                <CustomInput
                  id="firstName"
                  type="text"
                  placeholder="Enter your first name"
                  value={firstName}
                  onChange={(e) => setFirstNameValue(e.target.value)}
                  disabled={!isOwner}
                  className={FIELD_INPUT_CLASS}
                  autoComplete="given-name"
                />
              </SettingsField>
            </div>

            <div className="order-2 lg:col-start-1 lg:row-start-3">
              <SettingsField id="lastName" label="Last Name">
                <CustomInput
                  id="lastName"
                  type="text"
                  placeholder="Enter your last name"
                  value={lastName}
                  onChange={(e) => setLastNameValue(e.target.value)}
                  disabled={!isOwner}
                  className={FIELD_INPUT_CLASS}
                  autoComplete="family-name"
                />
              </SettingsField>
            </div>

            <div className="order-3 lg:col-start-1 lg:row-start-4">
              <SettingsField id="teamName" label="Team Name">
                <CustomInput
                  id="teamName"
                  type="text"
                  placeholder="Enter your team name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  disabled={!isOwner}
                  className={FIELD_INPUT_CLASS}
                  autoComplete="organization"
                />
              </SettingsField>
            </div>

            {isOwner ? (
              <>
                <div className="order-4 border-t border-gray-200 pt-6 dark:border-gray-700 lg:order-0 lg:col-start-2 lg:row-start-1 lg:border-t-0 lg:pt-0">
                  <h3 className={SECTION_TITLE_CLASS}>Change Password</h3>
                  <p className={SECTION_DESC_CLASS}>
                    Leave blank to keep your current password.
                  </p>
                </div>

                <div className="order-5 lg:order-0 lg:col-start-2 lg:row-start-2">
                  <SettingsField
                    id="currentPassword"
                    label="Current Password"
                    showPasswordToggle={{
                      checked: showCurrentPwd,
                      onChange: () => setShowCurrentPwd((prev) => !prev),
                      label: "Show password",
                    }}
                  >
                    <CustomInput
                      id="currentPassword"
                      type={showCurrentPwd ? "text" : "password"}
                      placeholder="Enter your current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      onFocus={handleCurrentPasswordFocus}
                      onBlur={handleCurrentPasswordBlur}
                      className={FIELD_INPUT_CLASS}
                      autoComplete="current-password"
                    />
                  </SettingsField>
                </div>

                <div className="order-6 lg:order-0 lg:col-start-2 lg:row-start-3">
                  <SettingsField
                    id="newPassword"
                    label="New Password"
                    showPasswordToggle={{
                      checked: showNewPwd,
                      onChange: () => setShowNewPwd((prev) => !prev),
                      label: "Show password",
                    }}
                  >
                    <CustomInput
                      id="newPassword"
                      type={showNewPwd ? "text" : "password"}
                      placeholder="Enter your new password (min 8 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={FIELD_INPUT_CLASS}
                      autoComplete="new-password"
                    />
                  </SettingsField>
                </div>

                <div className="order-7 lg:order-0 lg:col-start-2 lg:row-start-4">
                  <SettingsField
                    id="confirmPassword"
                    label="Confirm New Password"
                    showPasswordToggle={{
                      checked: showConfirmPwd,
                      onChange: () => setShowConfirmPwd((prev) => !prev),
                      label: "Show password",
                    }}
                  >
                    <CustomInput
                      id="confirmPassword"
                      type={showConfirmPwd ? "text" : "password"}
                      placeholder="Re-enter your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={FIELD_INPUT_CLASS}
                      autoComplete="new-password"
                    />
                  </SettingsField>
                </div>
              </>
            ) : null}
          </div>
        </form>
      </div>

      {isOwner ? (
        <div
          className={`fixed bottom-0 right-0 z-40 bg-white/95 py-4 backdrop-blur-sm dark:bg-[#0a0a0a]/95 ${
            isLeftNavOpen ? "left-0 lg:left-[280px]" : "left-0 lg:left-20"
          }`}
        >
          <div className="px-4 lg:px-[50px]">
            <div className={`mx-auto flex w-full ${FORM_MAX_WIDTH} justify-end`}>
              <button
                type="submit"
                form="account-settings-form"
                disabled={isSubmitting || !hasChanges}
                className="text-[13px] cursor-pointer bg-serene-purple text-pure-mist min-h-[45px] min-w-[145px] px-6 rounded-[10px] font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
              {isSubmitting ? (
                <Spinner className="border-white dark:border-deep-onyx" />
              ) : (
                <span>Save Changes</span>
              )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
