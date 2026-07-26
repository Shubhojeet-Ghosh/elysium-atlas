"use client";

import { useState, type CSSProperties } from "react";
import { X } from "lucide-react";
import CustomInput from "@/components/inputs/CustomInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { cn } from "@/lib/utils";
import type { VisitorHandoverState } from "@/types/humanHandover";
import { shouldShowHandoverContactForm } from "@/utils/humanHandoverVisitorUtils";

const FORM_INPUT_CLASS =
  "!h-10 !min-h-10 !max-h-10 w-full box-border !rounded-[10px] !border-2 !border-solid bg-white !px-[12px] !py-0 !text-[13px] !font-semibold !leading-none text-deep-onyx border-[var(--handover-primary)] focus:!border-[var(--handover-primary)] focus:outline-none";

interface VisitorHandoverDialogProps {
  handover: VisitorHandoverState;
  primaryColor: string;
  textColor: string;
  isSubmitting: boolean;
  isDeclining: boolean;
  onSubmit: (name: string, email: string) => void;
  onDecline: () => void;
}

export default function VisitorHandoverDialog({
  handover,
  primaryColor,
  textColor,
  isSubmitting,
  isDeclining,
  onSubmit,
  onDecline,
}: VisitorHandoverDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const showForm = shouldShowHandoverContactForm(
    handover.showContactForm,
    handover.contactStatus,
  );

  if (!showForm) return null;

  const isBusy = isSubmitting || isDeclining;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="handover-dialog-title"
    >
      <div className="w-full max-w-[340px] rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onDecline}
            disabled={isBusy}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close"
          >
            {isDeclining ? (
              <div
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent"
                style={{
                  borderColor: primaryColor,
                  borderTopColor: "transparent",
                }}
                role="status"
                aria-label="Loading"
              />
            ) : (
              <X size={16} />
            )}
          </button>
        </div>

        <div className="mt-2 space-y-3">
          <p
            id="handover-dialog-title"
            className="text-[13px] font-semibold text-deep-onyx"
          >
            Share your details so we can follow up if you leave before someone
            joins.
          </p>
          <div
            className="grid gap-2"
            style={{ "--handover-primary": primaryColor } as CSSProperties}
          >
            <CustomInput
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              disabled={isBusy}
              className={FORM_INPUT_CLASS}
              aria-label="Your name"
            />
            <CustomInput
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Your email"
              disabled={isBusy}
              className={FORM_INPUT_CLASS}
              aria-label="Your email"
            />
          </div>
          <div className="flex justify-end pt-1">
            <PrimaryButton
              className="!py-2 !px-4 !text-[12px] relative min-w-[120px] border-none cursor-pointer"
              style={{ backgroundColor: primaryColor, color: textColor }}
              disabled={isBusy}
              onClick={() => onSubmit(name, email)}
            >
              <span className={cn(isSubmitting && "invisible")}>
                Submit details
              </span>
              {isSubmitting && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="h-4 w-4 animate-spin rounded-full border-[3px] border-t-transparent"
                    style={{
                      borderColor: textColor,
                      borderTopColor: "transparent",
                    }}
                    role="status"
                    aria-label="Loading"
                  />
                </span>
              )}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
