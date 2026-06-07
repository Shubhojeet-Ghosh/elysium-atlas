"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";
import PrimaryButton from "@/components/ui/PrimaryButton";
import CustomInput from "@/components/inputs/CustomInput";
import CustomTextareaPrimary from "@/components/inputs/CustomTextareaPrimary";
import Spinner from "@/components/ui/Spinner";
import EmailUserMultiSelect from "@/components/ElysiumAtlas/email/EmailUserMultiSelect";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppSelector } from "@/store";
import { listTeamUsers } from "@/utils/emailAuthApi";
import {
  createEmailRecipientRule,
  listTeamEmailRecipientRules,
  updateEmailRecipientRule,
  type EmailRecipientRule,
} from "@/utils/emailRecipientRulesApi";
import { formatDateTime12hr } from "@/utils/formatDate";

type RuleSheetMode = "create" | "edit";

const MAX_RECIPIENTS_PER_LIST = 20;
const PROMPT_SNIPPET_LENGTH = 80;

function truncatePrompt(text: string, maxLength = PROMPT_SNIPPET_LENGTH) {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength).trim()}…`;
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function resetRuleFormState(setters: {
  setRuleName: (value: string) => void;
  setRecipientPrompt: (value: string) => void;
  setCcUserIds: (value: string[]) => void;
  setBccUserIds: (value: string[]) => void;
}) {
  setters.setRuleName("");
  setters.setRecipientPrompt("");
  setters.setCcUserIds([]);
  setters.setBccUserIds([]);
}

function populateRuleFormFromDetails(
  rule: EmailRecipientRule,
  setters: {
    setRuleName: (value: string) => void;
    setRecipientPrompt: (value: string) => void;
    setCcUserIds: (value: string[]) => void;
    setBccUserIds: (value: string[]) => void;
  },
) {
  setters.setRuleName(rule.rule_name || "");
  setters.setRecipientPrompt(rule.recipient_prompt || "");
  setters.setCcUserIds(rule.cc_user_ids || []);
  setters.setBccUserIds(rule.bcc_user_ids || []);
}

export default function EmailRecipientRules() {
  const teamID = useAppSelector((state) => state.emailUser.teamID);

  const [rules, setRules] = useState<EmailRecipientRule[]>([]);
  const [teamUsers, setTeamUsers] = useState<
    { user_id: string; name: string; email: string }[]
  >([]);
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isRuleSheetOpen, setIsRuleSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<RuleSheetMode>("create");
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleName, setRuleName] = useState("");
  const [recipientPrompt, setRecipientPrompt] = useState("");
  const [ccUserIds, setCcUserIds] = useState<string[]>([]);
  const [bccUserIds, setBccUserIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const userPickerItems = useMemo(
    () =>
      teamUsers.map((user) => ({
        value: user.user_id,
        label: `${user.name} (${user.email})`,
      })),
    [teamUsers],
  );

  const formSetters = {
    setRuleName,
    setRecipientPrompt,
    setCcUserIds,
    setBccUserIds,
  };

  const isFormValid =
    ruleName.trim() &&
    recipientPrompt.trim() &&
    (ccUserIds.length > 0 || bccUserIds.length > 0) &&
    ccUserIds.length <= MAX_RECIPIENTS_PER_LIST &&
    bccUserIds.length <= MAX_RECIPIENTS_PER_LIST &&
    userPickerItems.length > 0;

  const fetchTeamUsers = useCallback(async () => {
    if (!teamID) {
      setTeamUsers([]);
      setIsLoadingUsers(false);
      return;
    }

    setIsLoadingUsers(true);
    try {
      const data = await listTeamUsers(teamID);
      if (data.success && Array.isArray(data.users)) {
        setTeamUsers(data.users);
      } else {
        setTeamUsers([]);
      }
    } catch {
      setTeamUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [teamID]);

  const fetchRules = useCallback(async () => {
    if (!teamID) {
      setRules([]);
      setIsLoadingRules(false);
      return;
    }

    setIsLoadingRules(true);
    try {
      const data = await listTeamEmailRecipientRules(teamID);
      if (data.success && Array.isArray(data.rules)) {
        setRules(data.rules);
      } else {
        setRules([]);
      }
    } catch {
      setRules([]);
    } finally {
      setIsLoadingRules(false);
    }
  }, [teamID]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  useEffect(() => {
    fetchTeamUsers();
  }, [fetchTeamUsers]);

  const handleOpenCreateSheet = () => {
    resetRuleFormState(formSetters);
    setSheetMode("create");
    setEditingRuleId(null);
    setIsRuleSheetOpen(true);
  };

  const handleOpenEditSheet = (rule: EmailRecipientRule) => {
    populateRuleFormFromDetails(rule, formSetters);
    setSheetMode("edit");
    setEditingRuleId(rule.recipient_rule_id);
    setIsRuleSheetOpen(true);
  };

  const handleSaveRule = async () => {
    if (!teamID) {
      toast.error("Team not found. Please sign in again.", {
        position: "top-center",
      });
      return;
    }

    if (!ruleName.trim()) {
      toast.error("Please enter a name.", { position: "top-center" });
      return;
    }

    if (!recipientPrompt.trim()) {
      toast.error("Please describe when to add people to the reply.", {
        position: "top-center",
      });
      return;
    }

    if (ccUserIds.length === 0 && bccUserIds.length === 0) {
      toast.error("Add at least one person to CC or BCC.", {
        position: "top-center",
      });
      return;
    }

    if (
      ccUserIds.length > MAX_RECIPIENTS_PER_LIST ||
      bccUserIds.length > MAX_RECIPIENTS_PER_LIST
    ) {
      toast.error(`You can add up to ${MAX_RECIPIENTS_PER_LIST} people per list.`, {
        position: "top-center",
      });
      return;
    }

    setIsSaving(true);
    try {
      const data =
        sheetMode === "edit" && editingRuleId
          ? await updateEmailRecipientRule(
              editingRuleId,
              teamID,
              ruleName,
              recipientPrompt,
              ccUserIds,
              bccUserIds,
            )
          : await createEmailRecipientRule(
              teamID,
              ruleName,
              recipientPrompt,
              ccUserIds,
              bccUserIds,
            );

      if (data.success) {
        const wasEdit = sheetMode === "edit";
        setIsRuleSheetOpen(false);
        resetRuleFormState(formSetters);
        setEditingRuleId(null);
        setSheetMode("create");
        await fetchRules();
        toast.success(
          data.message ||
            (wasEdit
              ? "Smart recipients updated successfully."
              : "Smart recipients added successfully."),
          { position: "top-center" },
        );
      } else {
        toast.error(
          data.message ||
            (sheetMode === "edit"
              ? "Failed to update smart recipients."
              : "Failed to add smart recipients."),
          { position: "top-center" },
        );
      }
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(
          error,
          sheetMode === "edit"
            ? "Failed to update smart recipients. Please try again."
            : "Failed to add smart recipients. Please try again.",
        ),
        { position: "top-center" },
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSheetOpenChange = (open: boolean) => {
    setIsRuleSheetOpen(open);
    if (!open) {
      setIsSaving(false);
      setEditingRuleId(null);
      setSheetMode("create");
    }
  };

  return (
    <>
      <div className="w-full h-full">
        <div className="flex flex-col">
          <div className="lg:text-[22px] text-[18px] font-bold flex justify-between items-center">
            <div>Smart Recipients</div>
            <PrimaryButton
              onClick={handleOpenCreateSheet}
              className="font-[600] flex items-center justify-center gap-2 min-w-[100px] min-h-[40px] text-[13px]"
            >
              <Plus size={16} className="-ml-1" />
              <span>Add recipients</span>
            </PrimaryButton>
          </div>

          <div className="w-full mt-[24px] overflow-hidden">
            <div className="relative">
              <div className="overflow-x-auto md:overflow-visible">
                <div className="inline-block min-w-full align-middle">
                  <Table className="min-w-[800px] lg:min-w-full">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[180px] lg:w-[220px] font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                          Name
                        </TableHead>
                        <TableHead className="min-w-[220px] font-[600] py-3 px-[10px] text-[14px]">
                          Condition
                        </TableHead>
                        <TableHead className="min-w-[80px] font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                          CC
                        </TableHead>
                        <TableHead className="min-w-[80px] font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                          BCC
                        </TableHead>
                        <TableHead className="min-w-[180px] pl-4 md:pl-8 lg:pl-12 font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                          Updated
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingRules ? (
                        <TableRow className="hover:bg-transparent">
                          <TableCell
                            colSpan={5}
                            className="py-8 text-center text-[13px] text-gray-500"
                          >
                            Loading smart recipients...
                          </TableCell>
                        </TableRow>
                      ) : rules.length === 0 ? (
                        <TableRow className="hover:bg-transparent">
                          <TableCell
                            colSpan={5}
                            className="py-8 text-center text-[13px] text-gray-500"
                          >
                            No smart recipients configured yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        rules.map((rule) => (
                          <TableRow
                            key={rule.recipient_rule_id}
                            onClick={() => handleOpenEditSheet(rule)}
                            className="border-b border-gray-100 hover:bg-serene-purple/10 hover:text-serene-purple transition-all duration-200 cursor-pointer"
                          >
                            <TableCell className="font-medium py-4 px-[10px] text-[14px] whitespace-nowrap text-deep-onyx">
                              {rule.rule_name || "—"}
                            </TableCell>
                            <TableCell className="py-4 px-[10px] text-[14px] text-deep-onyx">
                              {truncatePrompt(rule.recipient_prompt)}
                            </TableCell>
                            <TableCell className="py-4 px-[10px] text-[14px] whitespace-nowrap text-deep-onyx">
                              {rule.cc_user_ids?.length ?? 0}
                            </TableCell>
                            <TableCell className="py-4 px-[10px] text-[14px] whitespace-nowrap text-deep-onyx">
                              {rule.bcc_user_ids?.length ?? 0}
                            </TableCell>
                            <TableCell className="py-4 px-[10px] pl-4 md:pl-8 lg:pl-12 text-[14px] whitespace-nowrap text-deep-onyx">
                              {rule.updated_at
                                ? formatDateTime12hr(rule.updated_at)
                                : rule.created_at
                                  ? formatDateTime12hr(rule.created_at)
                                  : "—"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Sheet open={isRuleSheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:w-[340px] sm:max-w-[90vw] z-[110] px-[4px] flex flex-col h-full max-h-screen overflow-hidden gap-0"
        >
          <SheetHeader className="shrink-0 px-4 pb-2">
            <SheetTitle>
              <div className="flex items-center justify-start">
                <Users className="inline mr-2" size={18} />
                <p>
                  {sheetMode === "edit"
                    ? "Edit smart recipients"
                    : "Add smart recipients"}
                </p>
              </div>
            </SheetTitle>
            <SheetDescription>
              {sheetMode === "edit"
                ? "Update when extra people should be added to replies."
                : "Choose when team members should be added to CC or BCC on replies."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-[8px]">
                <p className="text-[14px] font-[500] ml-[2px] text-gray-600">
                  Name
                </p>
                <CustomInput
                  type="text"
                  placeholder="e.g. Enterprise deal CC leadership"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="mt-[2px] min-h-[40px] w-full"
                />
              </div>

              <div className="flex flex-col gap-[8px]">
                <p className="text-[14px] font-[500] ml-[2px] text-gray-600">
                  When to add people
                </p>
                <CustomTextareaPrimary
                  placeholder="Describe the kind of emails where extra people should be included..."
                  value={recipientPrompt}
                  onChange={(e) => setRecipientPrompt(e.target.value)}
                  rows={5}
                  resizable={true}
                  className="mt-[2px] min-h-[120px] w-full"
                />
              </div>

              <div className="flex flex-col gap-[8px]">
                <p className="text-[14px] font-[500] ml-[2px] text-gray-600">
                  CC
                </p>
                <p className="text-[12px] text-gray-500 ml-[2px]">
                  People who can see they were copied on the reply.
                </p>
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center min-h-[40px]">
                    <Spinner className="border-gray-700" />
                  </div>
                ) : userPickerItems.length === 0 ? (
                  <p className="text-[12px] text-gray-500">
                    No team members found.
                  </p>
                ) : (
                  <EmailUserMultiSelect
                    items={userPickerItems}
                    selectedIds={ccUserIds}
                    onChange={setCcUserIds}
                    placeholder="Select people to CC..."
                    searchPlaceholder="Search team members..."
                    emptyMessage="No team member found."
                    className="text-[13px] font-[500]"
                  />
                )}
              </div>

              <div className="flex flex-col gap-[8px]">
                <p className="text-[14px] font-[500] ml-[2px] text-gray-600">
                  BCC
                </p>
                <p className="text-[12px] text-gray-500 ml-[2px]">
                  People who are copied without the customer seeing them.
                </p>
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center min-h-[40px]">
                    <Spinner className="border-gray-700" />
                  </div>
                ) : userPickerItems.length === 0 ? (
                  <p className="text-[12px] text-gray-500">
                    No team members found.
                  </p>
                ) : (
                  <EmailUserMultiSelect
                    items={userPickerItems}
                    selectedIds={bccUserIds}
                    onChange={setBccUserIds}
                    placeholder="Select people to BCC..."
                    searchPlaceholder="Search team members..."
                    emptyMessage="No team member found."
                    className="text-[13px] font-[500]"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-gray-100 px-4 py-4 bg-background">
            <PrimaryButton
              onClick={handleSaveRule}
              disabled={isSaving || !isFormValid}
              className="w-full font-[600] flex items-center justify-center gap-2 min-h-[40px] text-[13px]"
            >
              {isSaving ? (
                <Spinner className="border-white" />
              ) : (
                <span>{sheetMode === "edit" ? "Save changes" : "Add recipients"}</span>
              )}
            </PrimaryButton>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
