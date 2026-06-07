"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Route } from "lucide-react";
import { toast } from "sonner";
import PrimaryButton from "@/components/ui/PrimaryButton";
import CustomInput from "@/components/inputs/CustomInput";
import CustomTextareaPrimary from "@/components/inputs/CustomTextareaPrimary";
import AutoComplete from "@/components/ui/AutoComplete";
import Spinner from "@/components/ui/Spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { AgentStatusPill } from "@/components/ElysiumAtlas/AgentStatusPill";
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
import { useAppDispatch, useAppSelector } from "@/store";
import { setEmailDepartments } from "@/store/reducers/emailDepartmentsSlice";
import { listTeamDepartments } from "@/utils/emailDepartmentsApi";
import {
  createEmailRoutingRule,
  DEFAULT_ROUTING_RULE_PRIORITY,
  listTeamEmailRoutingRules,
  updateEmailRoutingRule,
  type EmailRoutingRule,
  type EmailRoutingRuleStatus,
} from "@/utils/emailRoutingRulesApi";
import { formatDateTime12hr } from "@/utils/formatDate";

type RuleSheetMode = "create" | "edit";

const STATUS_ITEMS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

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
  setSelectedDepartmentId: (value: string) => void;
  setRoutingPrompt: (value: string) => void;
  setPriority: (value: string) => void;
  setIsFallback: (value: boolean) => void;
  setStatus: (value: EmailRoutingRuleStatus) => void;
}) {
  setters.setRuleName("");
  setters.setSelectedDepartmentId("");
  setters.setRoutingPrompt("");
  setters.setPriority(String(DEFAULT_ROUTING_RULE_PRIORITY));
  setters.setIsFallback(false);
  setters.setStatus("active");
}

function populateRuleFormFromDetails(
  rule: EmailRoutingRule,
  setters: {
    setRuleName: (value: string) => void;
    setSelectedDepartmentId: (value: string) => void;
    setRoutingPrompt: (value: string) => void;
    setPriority: (value: string) => void;
    setIsFallback: (value: boolean) => void;
    setStatus: (value: EmailRoutingRuleStatus) => void;
  },
) {
  setters.setRuleName(rule.rule_name || "");
  setters.setSelectedDepartmentId(rule.department_id || "");
  setters.setRoutingPrompt(rule.routing_prompt || "");
  setters.setPriority(String(rule.priority ?? DEFAULT_ROUTING_RULE_PRIORITY));
  setters.setIsFallback(Boolean(rule.is_fallback));
  setters.setStatus(rule.status || "active");
}

export default function EmailRoutingRules() {
  const dispatch = useAppDispatch();
  const teamID = useAppSelector((state) => state.emailUser.teamID);
  const departmentsTeamID = useAppSelector(
    (state) => state.emailDepartments.teamID,
  );
  const departmentsLoaded = useAppSelector(
    (state) => state.emailDepartments.isLoaded,
  );
  const departments = useAppSelector(
    (state) => state.emailDepartments.departments,
  );

  const [rules, setRules] = useState<EmailRoutingRule[]>([]);
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  const [isRuleSheetOpen, setIsRuleSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<RuleSheetMode>("create");
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleName, setRuleName] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [routingPrompt, setRoutingPrompt] = useState("");
  const [priority, setPriority] = useState(
    String(DEFAULT_ROUTING_RULE_PRIORITY),
  );
  const [isFallback, setIsFallback] = useState(false);
  const [status, setStatus] = useState<EmailRoutingRuleStatus>("active");
  const [isSaving, setIsSaving] = useState(false);

  const departmentAutoCompleteItems = useMemo(
    () =>
      departments.map((department) => ({
        value: department.department_id,
        label: department.department_name,
      })),
    [departments],
  );

  const departmentNameById = useMemo(() => {
    const map = new Map<string, string>();
    departments.forEach((department) => {
      map.set(department.department_id, department.department_name);
    });
    return map;
  }, [departments]);

  const formSetters = {
    setRuleName,
    setSelectedDepartmentId,
    setRoutingPrompt,
    setPriority,
    setIsFallback,
    setStatus,
  };

  const isFormValid =
    ruleName.trim() &&
    selectedDepartmentId &&
    routingPrompt.trim() &&
    priority.trim() &&
    !Number.isNaN(Number(priority)) &&
    departmentAutoCompleteItems.length > 0;

  const fetchTeamDepartments = useCallback(async () => {
    if (!teamID || (departmentsLoaded && departmentsTeamID === teamID)) {
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

  const fetchRules = useCallback(async () => {
    if (!teamID) {
      setRules([]);
      setIsLoadingRules(false);
      return;
    }

    setIsLoadingRules(true);
    try {
      const data = await listTeamEmailRoutingRules(teamID, true);
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
    fetchTeamDepartments();
  }, [fetchTeamDepartments]);

  const handleOpenCreateSheet = () => {
    resetRuleFormState(formSetters);
    setSheetMode("create");
    setEditingRuleId(null);
    setIsRuleSheetOpen(true);
  };

  const handleOpenEditSheet = (rule: EmailRoutingRule) => {
    populateRuleFormFromDetails(rule, formSetters);
    setSheetMode("edit");
    setEditingRuleId(rule.routing_rule_id);
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

    if (!selectedDepartmentId) {
      toast.error("Please select a department.", { position: "top-center" });
      return;
    }

    if (!routingPrompt.trim()) {
      toast.error("Please describe when emails should go to this department.", {
        position: "top-center",
      });
      return;
    }

    const parsedPriority = Number(priority);
    if (Number.isNaN(parsedPriority)) {
      toast.error("Please enter a valid priority.", { position: "top-center" });
      return;
    }

    setIsSaving(true);
    try {
      const data =
        sheetMode === "edit" && editingRuleId
          ? await updateEmailRoutingRule(
              editingRuleId,
              teamID,
              selectedDepartmentId,
              ruleName,
              routingPrompt,
              parsedPriority,
              isFallback,
              status,
            )
          : await createEmailRoutingRule(
              teamID,
              selectedDepartmentId,
              ruleName,
              routingPrompt,
              parsedPriority,
              isFallback,
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
              ? "Smart routing updated successfully."
              : "Smart routing added successfully."),
          { position: "top-center" },
        );
      } else {
        toast.error(
          data.message ||
            (sheetMode === "edit"
              ? "Failed to update smart routing."
              : "Failed to add smart routing."),
          { position: "top-center" },
        );
      }
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(
          error,
          sheetMode === "edit"
            ? "Failed to update smart routing. Please try again."
            : "Failed to add smart routing. Please try again.",
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
            <div>Smart Routing</div>
            <PrimaryButton
              onClick={handleOpenCreateSheet}
              className="font-[600] flex items-center justify-center gap-2 min-w-[100px] min-h-[40px] text-[13px]"
            >
              <Plus size={16} className="-ml-1" />
              <span>Add routing</span>
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
                        <TableHead className="min-w-[160px] font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                          Department
                        </TableHead>
                        <TableHead className="min-w-[90px] font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                          Priority
                        </TableHead>
                        <TableHead className="min-w-[100px] font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                          Status
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
                            Loading smart routing...
                          </TableCell>
                        </TableRow>
                      ) : rules.length === 0 ? (
                        <TableRow className="hover:bg-transparent">
                          <TableCell
                            colSpan={5}
                            className="py-8 text-center text-[13px] text-gray-500"
                          >
                            No smart routing configured yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        rules.map((rule) => (
                          <TableRow
                            key={rule.routing_rule_id}
                            onClick={() => handleOpenEditSheet(rule)}
                            className="border-b border-gray-100 hover:bg-serene-purple/10 hover:text-serene-purple transition-all duration-200 cursor-pointer"
                          >
                            <TableCell className="font-medium py-4 px-[10px] text-[14px] whitespace-nowrap text-deep-onyx">
                              {rule.rule_name}
                            </TableCell>
                            <TableCell className="py-4 px-[10px] text-[14px] whitespace-nowrap text-deep-onyx">
                              {departmentNameById.get(rule.department_id) || "—"}
                            </TableCell>
                            <TableCell className="py-4 px-[10px] text-[14px] whitespace-nowrap text-deep-onyx">
                              {rule.priority}
                            </TableCell>
                            <TableCell className="py-4 px-[10px] text-[14px] whitespace-nowrap text-deep-onyx">
                              <AgentStatusPill status={rule.status} />
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
                <Route className="inline mr-2" size={18} />
                <p>{sheetMode === "edit" ? "Edit smart routing" : "Add smart routing"}</p>
              </div>
            </SheetTitle>
            <SheetDescription>
              {sheetMode === "edit"
                ? "Update when emails should be routed to a department."
                : "Tell the system when incoming emails should go to a department."}
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
                  placeholder="e.g. Refund requests"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="mt-[2px] min-h-[40px] w-full"
                />
              </div>

              <div className="flex flex-col gap-[8px]">
                <p className="text-[14px] font-[500] ml-[2px] text-gray-600">
                  Department
                </p>
                {departmentAutoCompleteItems.length === 0 ? (
                  <p className="text-[12px] text-gray-500">
                    No departments found. Create a department first.
                  </p>
                ) : (
                  <AutoComplete
                    items={departmentAutoCompleteItems}
                    value={selectedDepartmentId}
                    placeholder="Select a department..."
                    searchPlaceholder="Search department..."
                    emptyMessage="No department found."
                    onChange={(value) => setSelectedDepartmentId(value)}
                    className="text-[13px] font-[500]"
                    listMaxHeightClass="max-h-[200px]"
                  />
                )}
              </div>

              <div className="flex flex-col gap-[8px]">
                <p className="text-[14px] font-[500] ml-[2px] text-gray-600">
                  When to route here
                </p>
                <CustomTextareaPrimary
                  placeholder="Describe the kind of emails that should go to this department..."
                  value={routingPrompt}
                  onChange={(e) => setRoutingPrompt(e.target.value)}
                  rows={5}
                  resizable={true}
                  className="mt-[2px] min-h-[120px] w-full"
                />
              </div>

              <div className="flex flex-col gap-[8px]">
                <p className="text-[14px] font-[500] ml-[2px] text-gray-600">
                  Priority
                </p>
                <p className="text-[12px] text-gray-500 ml-[2px]">
                  Lower numbers are checked first when several rules could match.
                </p>
                <CustomInput
                  type="number"
                  min={0}
                  placeholder={String(DEFAULT_ROUTING_RULE_PRIORITY)}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="mt-[2px] min-h-[40px] w-full"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={isFallback}
                  onCheckedChange={(checked) => setIsFallback(checked === true)}
                  className="mt-[2px]"
                />
                <div className="flex flex-col gap-[2px]">
                  <span className="text-[13px] font-[600] text-gray-800">
                    Default department
                  </span>
                  <span className="text-[12px] text-gray-500 leading-snug">
                    Use this department when no other rule clearly applies.
                  </span>
                </div>
              </label>

              {sheetMode === "edit" && (
                <div className="flex flex-col gap-[8px]">
                  <p className="text-[14px] font-[500] ml-[2px] text-gray-600">
                    Status
                  </p>
                  <AutoComplete
                    items={STATUS_ITEMS}
                    value={status}
                    placeholder="Select status..."
                    searchPlaceholder="Search status..."
                    emptyMessage="No status found."
                    onChange={(value) =>
                      setStatus(value as EmailRoutingRuleStatus)
                    }
                    className="text-[13px] font-[500]"
                    listMaxHeightClass="max-h-[120px]"
                  />
                </div>
              )}
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
                <span>{sheetMode === "edit" ? "Save changes" : "Add routing"}</span>
              )}
            </PrimaryButton>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
