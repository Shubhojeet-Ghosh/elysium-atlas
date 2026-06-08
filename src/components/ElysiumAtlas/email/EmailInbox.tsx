"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, ChevronDown, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Spinner from "@/components/ui/Spinner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppDispatch, useAppSelector } from "@/store";
import { setEmailDepartments } from "@/store/reducers/emailDepartmentsSlice";
import {
  assignEmailThread,
  getEmailThread,
  listTeamThreads,
  sendThreadDraft,
  type EmailPagination,
  type EmailThread,
  type EmailThreadMessage,
  type EmailThreadSummary,
  type EmailMessageDirection,
} from "@/utils/emailAiAgentsApi";
import type { EmailUserRole } from "@/store/types/EmailUserTypes";
import { listTeamDepartments } from "@/utils/emailDepartmentsApi";
import type { EmailDepartment } from "@/store/types/EmailDepartmentsTypes";
import { formatDateTime12hr, formatSmartDateUTC } from "@/utils/formatDate";
import {
  getMessageAiHint,
  getThreadListBadge,
  getThreadListBadgeClasses,
  hasDraftReady,
} from "@/utils/emailThreadAiUi";
import EmailTablePagination from "@/components/ElysiumAtlas/email/EmailTablePagination";
import EmailMessageHtmlBody from "@/components/ElysiumAtlas/email/EmailMessageHtmlBody";
import EmailThreadAssignDialog from "@/components/ElysiumAtlas/email/EmailThreadAssignDialog";
import EmailThreadDraftPanel from "@/components/ElysiumAtlas/email/EmailThreadDraftPanel";

const THREADS_PAGE_SIZE = 20;
const MESSAGES_PAGE_SIZE = 20;
const INBOX_THREADS_POLL_INTERVAL_MS = 5000;
const MESSAGE_AVATAR_SIZE_CLASS =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[14px] font-medium text-white";

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object"
  ) {
    if ("status" in error.response && error.response.status === 403) {
      return "You do not have access to this thread.";
    }

    if (
      "data" in error.response &&
      error.response.data &&
      typeof error.response.data === "object" &&
      "message" in error.response.data &&
      typeof error.response.data.message === "string"
    ) {
      return error.response.data.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function getDepartmentName(
  departments: EmailDepartment[],
  departmentId?: string,
): string | undefined {
  const trimmedId = departmentId?.trim();
  if (!trimmedId) {
    return undefined;
  }

  return departments.find(
    (department) => department.department_id === trimmedId,
  )?.department_name;
}

function parseEmailAddress(raw?: string): { name: string; email: string } {
  if (!raw) return { name: "Unknown", email: "" };
  const match = raw.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim().replace(/^"|"$/g, ""), email: match[2] };
  }
  return { name: raw, email: raw };
}

function getInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed.charAt(0).toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-[#1a73e8]",
    "bg-[#188038]",
    "bg-[#e37400]",
    "bg-[#9334e6]",
    "bg-[#d93025]",
    "bg-[#007b83]",
    "bg-[#af5cf7]",
    "bg-[#c5221f]",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function formatRecipients(recipients: string[] | undefined): string {
  if (!recipients?.length) return "";
  return recipients
    .map((entry) => {
      const { name, email } = parseEmailAddress(entry);
      return name !== email ? name : email;
    })
    .join(", ");
}

function formatRecipientDetailed(raw: string): string {
  const { name, email } = parseEmailAddress(raw);
  if (name && email && name !== email) {
    return `${name} <${email}>`;
  }
  return email || name;
}

function MessageAvatar({
  name,
  emailOrName,
}: {
  name: string;
  emailOrName: string;
}) {
  const avatarColor = getAvatarColor(emailOrName);

  return (
    <div className={`${MESSAGE_AVATAR_SIZE_CLASS} ${avatarColor}`}>
      {getInitial(name)}
    </div>
  );
}

interface EmailMessageRecipientsPopoverProps {
  message: EmailThreadMessage;
}

function EmailMessageRecipientsPopover({
  message,
}: EmailMessageRecipientsPopoverProps) {
  const toLine = formatRecipients(message.to);
  const subject = message.subject?.trim() || "(No subject)";
  const timestamp = message.received_at
    ? formatDateTime12hr(message.received_at)
    : "—";

  const recipientSections = [
    { label: "from", values: message.from ? [message.from] : [] },
    { label: "to", values: message.to ?? [] },
    { label: "cc", values: message.cc ?? [] },
    { label: "bcc", values: message.bcc ?? [] },
    { label: "reply-to", values: message.reply_to ? [message.reply_to] : [] },
  ].filter((section) => section.values.length > 0);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          className="mt-0.5 flex max-w-full items-center gap-0.5 text-[12px] text-gray-500 hover:text-gray-700 cursor-pointer"
        >
          <span className="truncate">
            {toLine ? `to ${toLine}` : "View details"}
          </span>
          <ChevronDown size={14} className="shrink-0 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[420px] max-w-[calc(100vw-2rem)] p-3"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-y-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              subject
            </div>
            <div className="mt-1 text-[13px] text-gray-900 break-words">
              {subject}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              date
            </div>
            <div className="mt-1 text-[13px] text-gray-900">{timestamp}</div>
          </div>

          {recipientSections.map((section) => (
            <div key={section.label}>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                {section.label}
              </div>
              <div className="mt-1 space-y-1">
                {section.values.map((value) => (
                  <div
                    key={`${section.label}-${value}`}
                    className="text-[13px] text-gray-900 break-all"
                  >
                    {formatRecipientDetailed(value)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function threadFromSummary(
  summary: EmailThreadSummary,
  teamId: string,
): EmailThread {
  return {
    thread_id: summary.thread_id,
    agent_id: "",
    gmail_account_id: "",
    team_id: teamId,
    subject: summary.subject,
    snippet: summary.snippet,
    latest_from: "",
    participants: [],
    last_message_at: "",
    message_count: summary.message_count,
    has_unread: summary.has_unread,
    department_id: summary.department_id,
    department_name: summary.department_name,
    assigned_user_id: summary.assigned_user_id,
    assigned_user: summary.assigned_user,
    is_ai_processing: summary.is_ai_processing,
    ai_status: summary.ai_status,
    action_required: summary.action_required,
    ai_action: summary.ai_action,
    updated_at: "",
  };
}

function formatGmailMessageTime(dateString: string): string {
  let cleaned = dateString.replace(/\.(\d{3})\d+/, ".$1");
  const hasTimezone = /[Z]$|(\+|-)\d{2}:\d{2}$/.test(cleaned);
  if (!hasTimezone) cleaned += "Z";

  const date = new Date(cleaned);
  const now = new Date();
  const timeLabel = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return `${timeLabel} (just now)`;
  if (diffMins < 60) {
    return `${timeLabel} (${diffMins} minute${diffMins === 1 ? "" : "s"} ago)`;
  }

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${timeLabel} (${diffHours} hour${diffHours === 1 ? "" : "s"} ago)`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${timeLabel} (${diffDays} day${diffDays === 1 ? "" : "s"} ago)`;
  }

  return formatDateTime12hr(dateString);
}

function formatCollapsedTime(dateString: string): string {
  let cleaned = dateString.replace(/\.(\d{3})\d+/, ".$1");
  const hasTimezone = /[Z]$|(\+|-)\d{2}:\d{2}$/.test(cleaned);
  if (!hasTimezone) cleaned += "Z";

  const date = new Date(cleaned);
  const now = new Date();
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isSameDay) {
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  return formatSmartDateUTC(dateString);
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function EmailMessageStarsIcon({ label }: { label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="img"
          aria-label={label}
          className="inline-flex shrink-0 items-center"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <img
            src="/stars.svg"
            alt=""
            aria-hidden
            className="h-3.5 w-3.5 shrink-0 opacity-80"
          />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[260px] text-center">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function EmailMessageDirectionIcon({
  direction,
}: {
  direction: EmailMessageDirection;
}) {
  const isOutbound = direction === "outbound";
  const label = isOutbound ? "Outbound" : "Inbound";
  const Icon = isOutbound ? ArrowUpRight : ArrowDownLeft;
  const colorClass = isOutbound ? "text-serene-purple" : "text-teal-green";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="img"
          aria-label={label}
          className={`inline-flex shrink-0 items-center ${colorClass}`}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Icon size={14} strokeWidth={2.25} />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

interface EmailThreadMessageItemProps {
  message: EmailThreadMessage;
  isExpanded: boolean;
  isTriggerMessage?: boolean;
  onToggle: () => void;
}

function EmailThreadMessageItem({
  message,
  isExpanded,
  isTriggerMessage = false,
  onToggle,
}: EmailThreadMessageItemProps) {
  const sender = parseEmailAddress(message.from);
  const isOutbound = message.direction === "outbound";
  const bodyHtml = message.body_html?.trim() || "";
  const bodyText = message.body_text?.trim() || message.snippet?.trim() || "";
  const snippet =
    message.snippet?.trim() ||
    bodyText.split("\n")[0] ||
    (bodyHtml ? stripHtml(bodyHtml) : "") ||
    "";
  const aiHint = getMessageAiHint(message, isTriggerMessage);

  return (
    <article className="border-b border-gray-200 px-2 py-3">
      {!isExpanded ? (
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full min-w-0 items-center gap-3 text-left cursor-pointer transition-colors hover:opacity-80"
        >
          <MessageAvatar
            name={sender.name}
            emailOrName={sender.email || sender.name}
          />

          <span className="w-[140px] shrink-0 truncate text-[14px] font-medium text-gray-900">
            {sender.name}
            {isOutbound && (
              <span className="ml-1 text-[11px] font-normal text-gray-400">
                (Sent)
              </span>
            )}
          </span>

          <span className="min-w-0 flex-1 truncate text-[14px] text-gray-500">
            {snippet}
          </span>

          <div className="flex shrink-0 items-center justify-end gap-2">
            {aiHint && <EmailMessageStarsIcon label={aiHint} />}
            <EmailMessageDirectionIcon direction={message.direction} />
            <time
              className="text-right text-[12px] text-gray-500 whitespace-nowrap"
              dateTime={message.received_at}
            >
              {formatCollapsedTime(message.received_at)}
            </time>
          </div>
        </button>
      ) : (
        <div className="flex items-start gap-3">
          <MessageAvatar
            name={sender.name}
            emailOrName={sender.email || sender.name}
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={onToggle}
                  className="text-left text-[14px] font-medium text-gray-900 hover:opacity-80 cursor-pointer"
                >
                  {sender.name}
                  {isOutbound && (
                    <span className="ml-1 text-[11px] font-normal text-gray-400">
                      (Sent)
                    </span>
                  )}
                </button>
                <EmailMessageRecipientsPopover message={message} />
              </div>

              <div className="flex shrink-0 items-center justify-end gap-2">
                {aiHint && <EmailMessageStarsIcon label={aiHint} />}
                <EmailMessageDirectionIcon direction={message.direction} />
                <time
                  className="text-[12px] text-gray-500 whitespace-nowrap"
                  dateTime={message.received_at}
                >
                  {formatGmailMessageTime(message.received_at)}
                </time>
              </div>
            </div>

            <div className="mt-4 text-[14px] leading-relaxed text-gray-900 wrap-break-word">
              {bodyHtml ? (
                <EmailMessageHtmlBody html={bodyHtml} />
              ) : (
                <div className="whitespace-pre-wrap">
                  {bodyText || "No message content available."}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

interface EmailThreadDetailProps {
  teamId: string;
  thread: EmailThread;
  userRole: EmailUserRole | "";
  onBack: () => void;
  onDraftSent?: () => void;
  onThreadAssigned?: () => void;
}

function EmailThreadDetail({
  teamId,
  thread,
  userRole,
  onBack,
  onDraftSent,
  onThreadAssigned,
}: EmailThreadDetailProps) {
  const departments = useAppSelector(
    (state) => state.emailDepartments.departments,
  );
  const currentUserId = useAppSelector((state) => state.emailUser.userID);
  const [threadSummary, setThreadSummary] = useState<EmailThreadSummary | null>(
    null,
  );
  const [messages, setMessages] = useState<EmailThreadMessage[]>([]);
  const [loadedMessagePage, setLoadedMessagePage] = useState(0);
  const [messagePagination, setMessagePagination] =
    useState<EmailPagination | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [expandedMessageIds, setExpandedMessageIds] = useState<Set<string>>(
    new Set(),
  );
  const [isSendingDraft, setIsSendingDraft] = useState(false);
  const [isAssigningThread, setIsAssigningThread] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  const loadThreadMessages = useCallback(
    async (page: number, append = false) => {
      if (append) {
        setIsLoadingMoreMessages(true);
      } else {
        setIsLoadingMessages(true);
      }

      try {
        const data = await getEmailThread(
          teamId,
          thread.thread_id,
          page,
          MESSAGES_PAGE_SIZE,
        );

        if (!data.success) {
          throw new Error(data.message || "Failed to load thread messages.");
        }

        setThreadSummary(data.thread || null);
        setMessagePagination(data.pagination || null);
        setLoadedMessagePage(page);
        setMessages((current) =>
          append
            ? [...current, ...(data.messages || [])]
            : data.messages || [],
        );
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Failed to load thread."), {
          position: "top-center",
        });
        if (!append) {
          setMessages([]);
          setMessagePagination(null);
          setLoadedMessagePage(0);
        }
      } finally {
        setIsLoadingMessages(false);
        setIsLoadingMoreMessages(false);
      }
    },
    [teamId, thread.thread_id],
  );

  useEffect(() => {
    loadThreadMessages(1);
  }, [loadThreadMessages]);

  useEffect(() => {
    if (messages.length === 0) {
      setExpandedMessageIds(new Set());
      return;
    }

    const lastMessageId = messages[messages.length - 1].message_id;
    setExpandedMessageIds(new Set([lastMessageId]));
  }, [messages]);

  const handleLoadMoreMessages = () => {
    if (!messagePagination?.has_next || isLoadingMoreMessages) {
      return;
    }

    loadThreadMessages(loadedMessagePage + 1, true);
  };

  const toggleMessageExpanded = (messageId: string) => {
    setExpandedMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  const summary = threadSummary || {
    thread_id: thread.thread_id,
    subject: thread.subject,
    snippet: thread.snippet,
    message_count: thread.message_count,
    has_unread: thread.has_unread,
    department_id: thread.department_id,
    department_name: thread.department_name,
    assigned_user_id: thread.assigned_user_id,
    assigned_user: thread.assigned_user,
    action_required: thread.action_required,
    ai_action: thread.ai_action,
  };

  const triggerMessageId = summary.ai_action?.trigger_message_id?.trim();
  const showDraftPanel =
    summary.action_required && hasDraftReady(summary.ai_action);

  const handleSendDraft = async ({
    bodyText,
    cc,
    bcc,
    isEdited,
  }: {
    bodyText: string;
    cc: string[];
    bcc: string[];
    isEdited: boolean;
  }) => {
    if (isEdited && !bodyText.trim()) {
      toast.error("Draft body cannot be empty.", { position: "top-center" });
      return;
    }

    setIsSendingDraft(true);
    try {
      const data = await sendThreadDraft(teamId, thread.thread_id, {
        isEdited,
        bodyText,
        cc,
        bcc,
      });

      if (!data.success) {
        throw new Error(data.message || "Failed to send draft.");
      }

      toast.success(data.message || "AI draft sent successfully.", {
        position: "top-center",
      });
      await loadThreadMessages(1);
      onDraftSent?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to send draft."), {
        position: "top-center",
      });
    } finally {
      setIsSendingDraft(false);
    }
  };

  const departmentName =
    summary.department_name?.trim() ||
    getDepartmentName(departments, summary.department_id);
  const assignedUserId = summary.assigned_user_id?.trim();
  const assignedUserName =
    summary.assigned_user?.name?.trim() ||
    summary.assigned_user?.email?.trim();
  const isAdmin = userRole === "admin";
  const isMember = userRole === "member";
  const canAssignToSelf =
    isMember && Boolean(currentUserId) && assignedUserId !== currentUserId;
  const canAssignAsAdmin = isAdmin;
  const showAssignControl = canAssignToSelf || canAssignAsAdmin;

  const handleAssignThread = async (userId: string) => {
    if (!userId.trim()) {
      return;
    }

    setIsAssigningThread(true);
    try {
      const data = await assignEmailThread(teamId, thread.thread_id, userId);

      if (!data.success) {
        throw new Error(data.message || "Failed to assign thread.");
      }

      toast.success(data.message || "Email thread assigned successfully.", {
        position: "top-center",
      });

      if (data.data?.thread) {
        setThreadSummary((current) =>
          current
            ? {
                ...current,
                ...data.data?.thread,
              }
            : data.data?.thread || null,
        );
      } else {
        await loadThreadMessages(1);
      }

      setIsAssignDialogOpen(false);
      onThreadAssigned?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to assign thread."), {
        position: "top-center",
      });
    } finally {
      setIsAssigningThread(false);
    }
  };

  const handleAssignToSelf = () => {
    if (!currentUserId) {
      return;
    }

    void handleAssignThread(currentUserId);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between pb-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to inbox"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} className="text-gray-700" />
        </button>
        {showAssignControl && (
          <div>
            {canAssignAsAdmin ? (
              <button
                type="button"
                onClick={() => setIsAssignDialogOpen(true)}
                disabled={isAssigningThread}
                className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {assignedUserId ? "Reassign" : "Assign"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAssignToSelf}
                disabled={isAssigningThread}
                className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1.5 text-[12px] font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {isAssigningThread ? (
                  <Spinner className="border-serene-purple h-3.5 w-3.5" />
                ) : (
                  "Assign to me"
                )}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 pb-4 flex items-start justify-between gap-4">
        <h1 className="min-w-0 text-[22px] font-normal leading-tight text-gray-900">
          {summary.subject || "(No subject)"}
        </h1>
        {(departmentName || assignedUserName) && (
          <div className="shrink-0 pt-1 text-right text-[13px] text-gray-500">
            <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 whitespace-nowrap">
              {departmentName && (
                <div>
                  For{" "}
                  <span className="font-semibold text-gray-700">
                    {departmentName}
                  </span>
                </div>
              )}
              {assignedUserName && (
                <div className="text-[12px] text-gray-500">
                  Assigned to:{" "}
                  <span className="font-medium text-gray-700">
                    {assignedUserId === currentUserId
                      ? "you"
                      : assignedUserName}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {canAssignAsAdmin && (
        <EmailThreadAssignDialog
          open={isAssignDialogOpen}
          onOpenChange={setIsAssignDialogOpen}
          teamId={teamId}
          departmentId={summary.department_id}
          departmentName={departmentName}
          initialUserId={assignedUserId}
          isAssigning={isAssigningThread}
          onAssign={(userId) => void handleAssignThread(userId)}
        />
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center py-16">
            <Spinner className="border-serene-purple h-6 w-6" />
          </div>
        ) : (
          <div>
            {messages.length === 0 && !showDraftPanel ? (
              <div className="py-16 text-center text-[13px] text-gray-500">
                No messages in this thread yet.
              </div>
            ) : (
              messages.map((message) => (
                <EmailThreadMessageItem
                  key={message.message_id}
                  message={message}
                  isExpanded={expandedMessageIds.has(message.message_id)}
                  isTriggerMessage={
                    Boolean(triggerMessageId) &&
                    message.message_id === triggerMessageId
                  }
                  onToggle={() => toggleMessageExpanded(message.message_id)}
                />
              ))
            )}

            {showDraftPanel && summary.ai_action && (
              <EmailThreadDraftPanel
                aiAction={summary.ai_action}
                isSending={isSendingDraft}
                onSend={handleSendDraft}
              />
            )}

            {messagePagination?.has_next && (
              <div className="flex justify-center py-4">
                <button
                  type="button"
                  onClick={handleLoadMoreMessages}
                  disabled={isLoadingMoreMessages}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingMoreMessages ? (
                    <>
                      <Spinner className="border-serene-purple h-4 w-4" />
                      Loading messages...
                    </>
                  ) : (
                    "Load newer messages"
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EmailInbox() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const threadIdFromUrl = searchParams.get("thread");

  const teamID = useAppSelector((state) => state.emailUser.teamID);
  const userRole = useAppSelector((state) => state.emailUser.role);
  const departmentsTeamID = useAppSelector(
    (state) => state.emailDepartments.teamID,
  );
  const departmentsLoaded = useAppSelector(
    (state) => state.emailDepartments.isLoaded,
  );
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [threadPage, setThreadPage] = useState(1);
  const [threadPagination, setThreadPagination] =
    useState<EmailPagination | null>(null);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedThread, setSelectedThread] = useState<EmailThread | null>(
    null,
  );
  const [isLoadingThreadFromUrl, setIsLoadingThreadFromUrl] = useState(false);

  const updateThreadQuery = useCallback(
    (threadId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (threadId) {
        params.set("thread", threadId);
      } else {
        params.delete("thread");
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const fetchThreads = useCallback(
    async (
      page: number,
      showRefreshSpinner = false,
      silent = false,
    ) => {
      if (!teamID) {
        setThreads([]);
        setThreadPagination(null);
        if (!silent) {
          setIsLoadingThreads(false);
        }
        return;
      }

      if (!silent) {
        if (showRefreshSpinner) {
          setIsRefreshing(true);
        } else {
          setIsLoadingThreads(true);
        }
      }

      try {
        const data = await listTeamThreads(teamID, page, THREADS_PAGE_SIZE);

        if (!data.success) {
          throw new Error(data.message || "Failed to load email threads.");
        }

        setThreads(data.threads || []);
        setThreadPagination(data.pagination || null);
        setThreadPage(data.pagination?.page || page);
      } catch (error) {
        if (!silent) {
          toast.error(getApiErrorMessage(error, "Failed to load inbox."), {
            position: "top-center",
          });
          setThreads([]);
          setThreadPagination(null);
        }
      } finally {
        if (!silent) {
          setIsLoadingThreads(false);
          setIsRefreshing(false);
        }
      }
    },
    [teamID],
  );

  const fetchTeamDepartments = useCallback(async () => {
    if (!teamID) {
      return;
    }

    if (departmentsLoaded && departmentsTeamID === teamID) {
      return;
    }

    try {
      const data = await listTeamDepartments(teamID);
      if (data.success && Array.isArray(data.departments)) {
        dispatch(
          setEmailDepartments({
            teamID,
            departments: data.departments,
          }),
        );
      }
    } catch {
      // Leave existing Redux data unchanged on fetch failure.
    }
  }, [teamID, departmentsLoaded, departmentsTeamID, dispatch]);

  useEffect(() => {
    fetchThreads(1);
  }, [fetchThreads]);

  const shouldPollInboxThreads =
    Boolean(teamID) && !threadIdFromUrl && !selectedThread;

  useEffect(() => {
    if (!shouldPollInboxThreads) {
      return;
    }

    const intervalId = window.setInterval(() => {
      fetchThreads(threadPage, false, true);
    }, INBOX_THREADS_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [shouldPollInboxThreads, threadPage, fetchThreads]);

  useEffect(() => {
    fetchTeamDepartments();
  }, [fetchTeamDepartments]);

  useEffect(() => {
    if (!threadIdFromUrl) {
      setSelectedThread(null);
      setIsLoadingThreadFromUrl(false);
      return;
    }

    if (!teamID) {
      return;
    }

    const threadInList = threads.find(
      (thread) => thread.thread_id === threadIdFromUrl,
    );
    if (threadInList) {
      setSelectedThread(threadInList);
      setIsLoadingThreadFromUrl(false);
      return;
    }

    if (isLoadingThreads) {
      return;
    }

    let cancelled = false;

    const loadThreadFromUrl = async () => {
      setIsLoadingThreadFromUrl(true);
      try {
        const data = await getEmailThread(
          teamID,
          threadIdFromUrl,
          1,
          MESSAGES_PAGE_SIZE,
        );

        if (cancelled) return;

        if (!data.success || !data.thread) {
          throw new Error(data.message || "Thread not found.");
        }

        setSelectedThread(threadFromSummary(data.thread, teamID));
      } catch (error) {
        if (cancelled) return;

        setSelectedThread(null);
        toast.error(getApiErrorMessage(error, "Thread not found."), {
          position: "top-center",
        });
        updateThreadQuery(null);
      } finally {
        if (!cancelled) {
          setIsLoadingThreadFromUrl(false);
        }
      }
    };

    loadThreadFromUrl();

    return () => {
      cancelled = true;
    };
  }, [
    threadIdFromUrl,
    teamID,
    threads,
    isLoadingThreads,
    updateThreadQuery,
  ]);

  const handleThreadPageChange = (page: number) => {
    fetchThreads(page);
  };

  const handleRefresh = () => {
    fetchThreads(threadPage, true);
  };

  const handleSelectThread = (thread: EmailThread) => {
    setSelectedThread(thread);
    if (threadIdFromUrl !== thread.thread_id) {
      updateThreadQuery(thread.thread_id);
    }
  };

  const handleBackToList = () => {
    setSelectedThread(null);
    if (threadIdFromUrl) {
      updateThreadQuery(null);
    }
  };

  const showThreadView = Boolean(selectedThread) && Boolean(teamID);
  const isOpeningThreadFromUrl =
    Boolean(threadIdFromUrl) &&
    !selectedThread &&
    (isLoadingThreadFromUrl || isLoadingThreads);

  return (
    <div className="w-full h-full">
      <div className="flex flex-col h-full min-h-[calc(100vh-140px)]">
        {!showThreadView && !isOpeningThreadFromUrl && (
          <>
            <div className="lg:text-[22px] text-[18px] font-bold shrink-0">
              Inbox
            </div>

            <div className="mt-4 flex min-h-0 flex-1 flex-col">
              <div className="mb-3 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
                {threadPagination && (
                  <EmailTablePagination
                    currentPage={threadPage}
                    totalPages={threadPagination.total_pages}
                    hasNext={threadPagination.has_next}
                    hasPrev={threadPagination.has_prev}
                    total={threadPagination.total}
                    onPageChange={handleThreadPageChange}
                    className="w-full sm:w-auto"
                  />
                )}
                <div className="flex w-full justify-end sm:w-auto">
                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={isLoadingThreads || isRefreshing || !teamID}
                    aria-label="Refresh threads"
                    className="hidden sm:inline-flex shrink-0 items-center justify-center h-9 w-9 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRefreshing ? (
                      <Spinner className="border-serene-purple h-4 w-4" />
                    ) : (
                      <RefreshCw size={16} className="text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto overflow-x-auto">
                  {isLoadingThreads ? (
                    <div className="py-12 text-center text-[13px] text-gray-500">
                      Loading threads...
                    </div>
                  ) : threads.length === 0 ? (
                    <div className="py-12 text-center text-[13px] text-gray-500">
                      {userRole === "member"
                        ? "No threads visible for your department yet."
                        : "No email threads yet. Sync an inbox from AI Agents."}
                    </div>
                  ) : (
                    <div className="min-w-[560px]">
                      {threads.map((thread) => {
                        const from = parseEmailAddress(thread.latest_from);
                        const subject = thread.subject || "(No subject)";
                        const snippet = thread.snippet?.trim() || "";
                        const timestamp = thread.last_message_at
                          ? formatSmartDateUTC(thread.last_message_at)
                          : "—";
                        const listBadge = getThreadListBadge(thread);

                        return (
                          <button
                            key={thread.thread_id}
                            type="button"
                            onClick={() => handleSelectThread(thread)}
                            className={`grid w-full grid-cols-[minmax(120px,200px)_minmax(180px,1fr)_minmax(64px,96px)] items-center gap-3 border-b border-gray-100 px-3 py-2 text-left cursor-pointer transition-colors hover:bg-gray-50 ${
                              thread.has_unread ? "bg-white" : "bg-gray-50/40"
                            }`}
                          >
                            <span
                              className={`truncate text-[13px] ${
                                thread.has_unread
                                  ? "font-semibold text-deep-onyx"
                                  : "font-normal text-gray-700"
                              }`}
                            >
                              {from.name}
                            </span>

                            <span className="min-w-0 truncate text-[13px]">
                              <span
                                className={
                                  thread.has_unread || listBadge
                                    ? "font-semibold text-deep-onyx"
                                    : "font-normal text-gray-800"
                                }
                              >
                                {subject}
                              </span>
                              {listBadge && (
                                <span
                                  className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getThreadListBadgeClasses(listBadge.tone)}`}
                                >
                                  {listBadge.label}
                                </span>
                              )}
                              {snippet && (
                                <span className="font-normal text-gray-500">
                                  {" "}
                                  — {snippet}
                                </span>
                              )}
                            </span>

                            <span className="truncate text-right text-[12px] text-gray-500 whitespace-nowrap">
                              {timestamp}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {threadPagination && threadPagination.total_pages > 1 && (
                <EmailTablePagination
                  currentPage={threadPage}
                  totalPages={threadPagination.total_pages}
                  hasNext={threadPagination.has_next}
                  hasPrev={threadPagination.has_prev}
                  total={threadPagination.total}
                  onPageChange={handleThreadPageChange}
                  className="mt-3"
                />
              )}
            </div>
          </>
        )}

        {isOpeningThreadFromUrl && (
          <div className="flex min-h-[240px] flex-1 items-center justify-center">
            <Spinner className="border-serene-purple h-6 w-6" />
          </div>
        )}

        {showThreadView && selectedThread && (
          <div className="flex min-h-0 flex-1 flex-col">
            <EmailThreadDetail
              teamId={teamID}
              thread={selectedThread}
              userRole={userRole}
              onBack={handleBackToList}
              onDraftSent={() => fetchThreads(threadPage, true)}
              onThreadAssigned={() => fetchThreads(threadPage, true)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
