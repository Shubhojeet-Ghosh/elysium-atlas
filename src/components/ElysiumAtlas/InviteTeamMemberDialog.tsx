"use client";

import { useState } from "react";
import { UserPlus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import CustomInput from "@/components/inputs/CustomInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Spinner from "@/components/ui/Spinner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteTeamMembers } from "@/utils/teamApi";
import type { InvitableRole } from "@/types/teamMembers";
import {
  getInviteStatusMessage,
  shouldShowInviteStatusInDialog,
} from "@/utils/teamInviteMessages";

const INVITE_FIELD_CLASS =
  "!h-10 !min-h-10 !max-h-10 w-full box-border !rounded-[10px] !border-2 border-gray-300 bg-white !px-[12px] !py-0 !text-[13px] !font-semibold !leading-none text-deep-onyx dark:border-deep-onyx dark:bg-deep-onyx dark:text-pure-mist";

function getRoleNoteMessage(role: InvitableRole): string {
  if (role === "admin") {
    return "Admins have the same access level as the owner across the platform,";
  }
  return "Members have a limited access level across the platform compared to owners and admins.";
}

interface InviteTeamMemberDialogProps {
  onInviteSuccess?: () => void;
}

export default function InviteTeamMemberDialog({
  onInviteSuccess,
}: InviteTeamMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InvitableRole>("member");
  const [isLoading, setIsLoading] = useState(false);
  const [inlineMessage, setInlineMessage] = useState<{
    text: string;
    variant: "error" | "info";
  } | null>(null);

  const resetForm = () => {
    setEmail("");
    setRole("member");
    setInlineMessage(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetForm();
    }
  };

  const handleSendInvitation = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setInlineMessage({
        text: "Please enter an email address.",
        variant: "error",
      });
      return;
    }

    setIsLoading(true);
    setInlineMessage(null);

    try {
      const response = await inviteTeamMembers([trimmedEmail], role);

      if (!response.success) {
        setInlineMessage({
          text: response.message || "Failed to send invitation.",
          variant: "error",
        });
        return;
      }

      const result = response.results?.[0];
      if (!result) {
        setInlineMessage({
          text: "No response received for this invitation.",
          variant: "error",
        });
        return;
      }

      if (shouldShowInviteStatusInDialog(result.status)) {
        setInlineMessage({
          text: getInviteStatusMessage(result.status, trimmedEmail),
          variant: "error",
        });
        return;
      }

      if (result.status === "already_member") {
        toast.info(getInviteStatusMessage(result.status, trimmedEmail));
        setOpen(false);
        resetForm();
        return;
      }

      if (
        result.status === "invited" ||
        result.status === "already_invited"
      ) {
        toast.success(getInviteStatusMessage(result.status, trimmedEmail));
        setOpen(false);
        resetForm();
        onInviteSuccess?.();
        return;
      }

      setInlineMessage({
        text: getInviteStatusMessage(result.status, trimmedEmail),
        variant: "error",
      });
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setInlineMessage({
        text:
          err.response?.data?.message ||
          err.message ||
          "Failed to send invitation. Please try again.",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <PrimaryButton className="font-[600] flex items-center justify-center gap-2 min-w-[100px] min-h-[40px] text-[13px]">
          <UserPlus size={16} className="-ml-1" />
          <span>Invite</span>
        </PrimaryButton>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[425px]"
        onPointerDownOutside={(event) => {
          const target = event.target;
          if (
            target instanceof Element &&
            target.closest('[data-slot="select-content"]')
          ) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Invite team member</DialogTitle>
          <DialogDescription>
            Send an invitation to someone who already has an Atlas account.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <p className="font-bold text-[13px]">Email address</p>
            <CustomInput
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (inlineMessage) setInlineMessage(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSendInvitation();
                }
              }}
              className={`${INVITE_FIELD_CLASS} placeholder-gray-400 focus:border-serene-purple dark:focus:border-serene-purple`}
              disabled={isLoading}
            />
          </div>

          <div className="grid gap-1.5">
            <p className="font-bold text-[13px]">Role</p>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as InvitableRole)}
              disabled={isLoading}
            >
              <SelectTrigger
                className={`${INVITE_FIELD_CLASS} shadow-none data-[size=default]:!h-10 data-[size=default]:!min-h-10 focus-visible:border-serene-purple focus-visible:ring-serene-purple/30`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                position="popper"
                className="z-[1100]"
              >
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[12px] text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-danger-red">NOTE :</span>{" "}
              {getRoleNoteMessage(role)}
            </p>
          </div>

          {inlineMessage && (
            <div
              className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-[13px] leading-snug ${
                inlineMessage.variant === "error"
                  ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100"
                  : "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-100"
              }`}
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{inlineMessage.text}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <PrimaryButton
              className="bg-transparent border border-gray-300 dark:border-white text-gray-700 dark:text-white text-[12px] hover:bg-white dark:hover:bg-pure-mist dark:hover:text-deep-onyx"
              disabled={isLoading}
            >
              Cancel
            </PrimaryButton>
          </DialogClose>
          <PrimaryButton
            className="text-[12px] font-semibold flex items-center justify-center gap-2 min-w-[130px]"
            onClick={handleSendInvitation}
            disabled={isLoading}
          >
            {isLoading ? (
              <Spinner className="border-white dark:border-deep-onyx" />
            ) : (
              <span>Send Invitation</span>
            )}
          </PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
