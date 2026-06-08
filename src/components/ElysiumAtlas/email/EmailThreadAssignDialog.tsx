"use client";

import { useEffect, useMemo, useState } from "react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Spinner from "@/components/ui/Spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EmailUserMultiSelect from "@/components/ElysiumAtlas/email/EmailUserMultiSelect";
import { listTeamUsers, type EmailTeamUser } from "@/utils/emailAuthApi";

interface EmailThreadAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  departmentId?: string;
  departmentName?: string;
  initialUserId?: string;
  isAssigning: boolean;
  onAssign: (userId: string) => void;
}

function normalizeCompareValue(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function userMatchesThreadDepartment(
  user: EmailTeamUser,
  departmentId: string,
  departmentName: string,
) {
  const userDepartmentId = normalizeCompareValue(user.department_id);
  const userDepartmentName = normalizeCompareValue(user.department_name);

  if (departmentId && userDepartmentId === departmentId) {
    return true;
  }

  if (departmentName && userDepartmentName === departmentName) {
    return true;
  }

  return false;
}

function getEligibleUsers(
  teamUsers: EmailTeamUser[],
  departmentId?: string,
  departmentName?: string,
) {
  const normalizedDepartmentId = normalizeCompareValue(departmentId);
  const normalizedDepartmentName = normalizeCompareValue(departmentName);

  if (!normalizedDepartmentId && !normalizedDepartmentName) {
    return teamUsers;
  }

  const departmentMatches = teamUsers.filter((user) =>
    userMatchesThreadDepartment(
      user,
      normalizedDepartmentId,
      normalizedDepartmentName,
    ),
  );

  if (departmentMatches.length > 0) {
    return departmentMatches;
  }

  // Fallback: show full team so admins can still assign when department
  // metadata is inconsistent; the API validates the final choice.
  return teamUsers;
}

export default function EmailThreadAssignDialog({
  open,
  onOpenChange,
  teamId,
  departmentId,
  departmentName,
  initialUserId,
  isAssigning,
  onAssign,
}: EmailThreadAssignDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [teamUsers, setTeamUsers] = useState<EmailTeamUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedUserId(initialUserId?.trim() || "");
  }, [open, initialUserId]);

  useEffect(() => {
    if (!open || !teamId) {
      return;
    }

    let cancelled = false;

    const loadUsers = async () => {
      setIsLoadingUsers(true);
      setLoadError(false);
      try {
        const data = await listTeamUsers(teamId);
        if (cancelled) {
          return;
        }

        if (data.success && Array.isArray(data.users)) {
          setTeamUsers(data.users);
        } else {
          setTeamUsers([]);
          setLoadError(true);
        }
      } catch {
        if (!cancelled) {
          setTeamUsers([]);
          setLoadError(true);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingUsers(false);
        }
      }
    };

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, [open, teamId]);

  const eligibleUsers = useMemo(
    () => getEligibleUsers(teamUsers, departmentId, departmentName),
    [departmentId, departmentName, teamUsers],
  );

  const userPickerItems = useMemo(
    () =>
      eligibleUsers.map((user) => {
        const name = user.name?.trim();
        return {
          value: user.user_id,
          label: name || user.email,
          description: name ? user.email : undefined,
        };
      }),
    [eligibleUsers],
  );

  const isUsingFullTeamFallback =
    teamUsers.length > 0 &&
    eligibleUsers.length === teamUsers.length &&
    Boolean(normalizeCompareValue(departmentId) || normalizeCompareValue(departmentName)) &&
    !teamUsers.some((user) =>
      userMatchesThreadDepartment(
        user,
        normalizeCompareValue(departmentId),
        normalizeCompareValue(departmentName),
      ),
    );

  const emptyMessage = loadError
    ? "Could not load team members. Try again."
    : teamUsers.length === 0
      ? "No team members found for this team."
      : `No team members matched${departmentName ? ` ${departmentName}` : " this thread's department"}.`;

  const handleSelectionChange = (selectedIds: string[]) => {
    if (selectedIds.length === 0) {
      setSelectedUserId("");
      return;
    }

    setSelectedUserId(selectedIds[selectedIds.length - 1]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Assign thread</DialogTitle>
          <DialogDescription>
            Choose a team member to own this conversation.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {isLoadingUsers ? (
            <div className="flex min-h-[40px] items-center justify-center">
              <Spinner className="border-gray-700" />
            </div>
          ) : userPickerItems.length === 0 ? (
            <p className="text-[13px] text-gray-500">{emptyMessage}</p>
          ) : (
            <>
              {isUsingFullTeamFallback && (
                <p className="mb-2 text-[12px] text-gray-500">
                  Showing all team members. The assignee must belong to
                  {departmentName ? ` ${departmentName}` : " the thread department"}.
                </p>
              )}
              <EmailUserMultiSelect
                items={userPickerItems}
                selectedIds={selectedUserId ? [selectedUserId] : []}
                onChange={handleSelectionChange}
                placeholder="Select a team member..."
                searchPlaceholder="Search team members..."
                emptyMessage="No team member found."
                className="text-[13px] font-medium"
              />
            </>
          )}
        </div>

        <DialogFooter>
          <PrimaryButton
            type="button"
            onClick={() => onAssign(selectedUserId)}
            disabled={isAssigning || !selectedUserId}
            className="min-h-[40px] text-[13px] font-semibold"
          >
            {isAssigning ? <Spinner className="border-white" /> : "Assign"}
          </PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
