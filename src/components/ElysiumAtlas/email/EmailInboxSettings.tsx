"use client";

import { useCallback, useEffect, useState } from "react";
import { Inbox, Plus } from "lucide-react";
import { toast } from "sonner";
import PrimaryButton from "@/components/ui/PrimaryButton";
import CustomInput from "@/components/inputs/CustomInput";
import Spinner from "@/components/ui/Spinner";
import { GoogleIcon } from "@/components/TechStacks/Icons";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
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
import { AgentStatusPill } from "@/components/ElysiumAtlas/AgentStatusPill";
import {
  createGmailAccount,
  listGmailAccounts,
  type GmailAccount,
} from "@/utils/gmailAccountsApi";
import { formatDateTime12hr } from "@/utils/formatDate";
import {
  clearGmailInboxNameDraft,
  clearGmailOAuthCode,
  getGmailOAuthCode,
  handleGmailOAuthCallback,
  openGmailOAuth,
  readGmailInboxNameDraft,
} from "@/utils/gmailOAuth";

export default function EmailInboxSettings() {
  const [isAddInboxOpen, setIsAddInboxOpen] = useState(false);
  const [inboxLabel, setInboxLabel] = useState("");
  const [hasOAuthCode, setHasOAuthCode] = useState(false);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [isConnectingAccount, setIsConnectingAccount] = useState(false);
  const [accounts, setAccounts] = useState<GmailAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  const syncOAuthCodeState = useCallback(() => {
    setHasOAuthCode(Boolean(getGmailOAuthCode()));
  }, []);

  const fetchAccounts = useCallback(async () => {
    setIsLoadingAccounts(true);
    try {
      const data = await listGmailAccounts();
      if (data.success && Array.isArray(data.accounts)) {
        setAccounts(data.accounts);
      } else {
        setAccounts([]);
      }
    } catch {
      setAccounts([]);
    } finally {
      setIsLoadingAccounts(false);
    }
  }, []);

  useEffect(() => {
    const draftName = readGmailInboxNameDraft();
    if (draftName) {
      setInboxLabel(draftName);
    }

    const callbackResult = handleGmailOAuthCallback();
    if (callbackResult.status === "success") {
      syncOAuthCodeState();
      setIsAddInboxOpen(true);
      toast.success("Google authorization received. Click Connect account.", {
        position: "top-center",
      });
    } else if (callbackResult.status === "error") {
      toast.error(callbackResult.message, { position: "top-center" });
    } else {
      syncOAuthCodeState();
      if (getGmailOAuthCode()) {
        setIsAddInboxOpen(true);
      }
    }

    fetchAccounts();
  }, [syncOAuthCodeState, fetchAccounts]);

  const handleConnectGoogleWorkspace = () => {
    setIsConnectingGoogle(true);
    try {
      openGmailOAuth(inboxLabel);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to start Google authorization.";
      toast.error(message, { position: "top-center" });
      setIsConnectingGoogle(false);
    }
  };

  const handleConnectAccount = async () => {
    const code = getGmailOAuthCode();
    if (!code) {
      toast.error("Google authorization code not found. Please connect again.", {
        position: "top-center",
      });
      setHasOAuthCode(false);
      return;
    }

    if (!inboxLabel.trim()) {
      toast.error("Please enter an inbox name.", { position: "top-center" });
      return;
    }

    setIsConnectingAccount(true);
    try {
      const data = await createGmailAccount(inboxLabel, code);

      if (data.success) {
        clearGmailOAuthCode();
        clearGmailInboxNameDraft();
        setHasOAuthCode(false);
        setInboxLabel("");
        setIsAddInboxOpen(false);
        await fetchAccounts();
        toast.success(data.message || "Gmail inbox connected successfully.", {
          position: "top-center",
        });
      } else {
        toast.error(data.message || "Failed to connect Gmail inbox.", {
          position: "top-center",
        });
      }
    } catch (error: unknown) {
      const message =
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
          ? error.response.data.message
          : "Failed to connect Gmail inbox. Please try again.";

      toast.error(message, { position: "top-center" });
    } finally {
      setIsConnectingAccount(false);
    }
  };

  const handleSheetOpenChange = (open: boolean) => {
    setIsAddInboxOpen(open);
    if (!open) {
      setIsConnectingGoogle(false);
      setIsConnectingAccount(false);
    }
  };

  return (
    <>
      <div className="w-full h-full">
        <div className="flex flex-col">
          <div className="lg:text-[22px] text-[18px] font-bold flex justify-between items-center">
            <div>Inbox Integration</div>
            <PrimaryButton
              onClick={() => setIsAddInboxOpen(true)}
              className="font-[600] flex items-center justify-center gap-2 min-w-[100px] min-h-[40px] text-[13px]"
            >
              <Plus size={16} className="-ml-1" />
              <span>Add inbox</span>
            </PrimaryButton>
          </div>

          <div className="w-full mt-[24px] overflow-hidden">
            <div className="relative">
              <div className="overflow-x-auto md:overflow-visible">
                <div className="inline-block min-w-full align-middle">
                  <Table className="min-w-[700px] lg:min-w-full">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[180px] lg:w-[220px] font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                          Inbox Name
                        </TableHead>
                        <TableHead className="min-w-[200px] lg:min-w-[240px] font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                          Email
                        </TableHead>
                        <TableHead className="min-w-[120px] font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                          Status
                        </TableHead>
                        <TableHead className="min-w-[180px] pl-4 md:pl-8 lg:pl-12 font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                          Connected
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingAccounts ? (
                        <TableRow className="hover:bg-transparent">
                          <TableCell
                            colSpan={4}
                            className="py-8 text-center text-[13px] text-gray-500"
                          >
                            Loading inboxes...
                          </TableCell>
                        </TableRow>
                      ) : accounts.length === 0 ? (
                        <TableRow className="hover:bg-transparent">
                          <TableCell
                            colSpan={4}
                            className="py-8 text-center text-[13px] text-gray-500"
                          >
                            No inboxes connected yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        accounts.map((account) => (
                          <TableRow
                            key={account.account_id}
                            className="border-b border-gray-100 hover:bg-serene-purple/10 hover:text-serene-purple transition-all duration-200"
                          >
                            <TableCell className="font-medium py-4 px-[10px] text-[14px] whitespace-nowrap text-deep-onyx">
                              {account.inbox_name}
                            </TableCell>
                            <TableCell className="py-4 px-[10px] text-[14px] whitespace-nowrap text-deep-onyx">
                              {account.email_address}
                            </TableCell>
                            <TableCell className="py-4 px-[10px] text-[14px] whitespace-nowrap">
                              <AgentStatusPill status={account.status} />
                            </TableCell>
                            <TableCell className="py-4 px-[10px] pl-4 md:pl-8 lg:pl-12 text-[14px] whitespace-nowrap text-deep-onyx">
                              {account.connected_at
                                ? formatDateTime12hr(account.connected_at)
                                : account.created_at
                                  ? formatDateTime12hr(account.created_at)
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

      <Sheet open={isAddInboxOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:w-[340px] sm:max-w-[90vw] z-[110] px-[4px] flex flex-col"
        >
          <SheetHeader>
            <SheetTitle>
              <div className="flex items-center justify-start">
                <Inbox className="inline mr-2" size={18} />
                <p>Add inbox</p>
              </div>
            </SheetTitle>
            <SheetDescription>
              Connect an email inbox to your account.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 px-4 flex flex-col gap-6 flex-1">
            <div className="flex flex-col gap-[8px]">
              <p className="text-[14px] font-[500] ml-[2px] text-gray-600">
                Inbox Name
              </p>
              <CustomInput
                type="text"
                placeholder="Enter inbox name"
                value={inboxLabel}
                onChange={(e) => setInboxLabel(e.target.value)}
                className="mt-[2px] min-h-[40px] w-full"
              />
            </div>

            <button
              type="button"
              onClick={handleConnectGoogleWorkspace}
              disabled={isConnectingGoogle || isConnectingAccount}
              className="min-h-[40px] w-full flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-[10px] text-[12px] font-semibold text-gray-700 bg-white hover:bg-gray-50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnectingGoogle ? (
                <Spinner className="border-gray-700" />
              ) : (
                <>
                  <GoogleIcon />
                  <span className="text-[12px]">
                    {hasOAuthCode
                      ? "Google account authorized"
                      : "Connect to Google Workspace"}
                  </span>
                </>
              )}
            </button>
          </div>

          {hasOAuthCode && (
            <SheetFooter className="px-4 pb-4">
              <PrimaryButton
                onClick={handleConnectAccount}
                disabled={isConnectingAccount || !inboxLabel.trim()}
                className="w-full font-[600] flex items-center justify-center gap-2 min-h-[40px] text-[13px]"
              >
                {isConnectingAccount ? (
                  <Spinner className="border-white" />
                ) : (
                  <span>Connect account</span>
                )}
              </PrimaryButton>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
