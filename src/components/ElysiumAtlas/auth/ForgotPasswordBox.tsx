"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import CustomInput from "@/components/inputs/CustomInput";
import Spinner from "@/components/ui/Spinner";
import { requestPasswordReset } from "@/utils/authApi";

interface ForgotPasswordBoxProps {
  initialEmail?: string;
}

export default function ForgotPasswordBox({
  initialEmail = "",
}: ForgotPasswordBoxProps) {
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const sendResetLink = async (targetEmail: string) => {
    const trimmedEmail = targetEmail.trim().toLowerCase();

    if (!trimmedEmail) {
      toast.error("Please enter your email", { position: "top-center" });
      return false;
    }

    try {
      const response = await requestPasswordReset(trimmedEmail);

      if (response.success) {
        setEmailSent(true);
        return true;
      }

      toast.error(response.message || "Something went wrong.", {
        position: "top-center",
      });
      return false;
    } catch {
      toast.error("We are facing some issues, please try again later", {
        position: "top-center",
      });
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await sendResetLink(email);
    setIsLoading(false);
  };

  const handleResend = async () => {
    setIsResending(true);
    const sent = await sendResetLink(email);
    if (sent) {
      toast.success("Reset link sent again. Check your email.", {
        position: "top-center",
      });
    }
    setIsResending(false);
  };

  if (emailSent) {
    return (
      <div className="flex flex-col p-6 md:w-[400px] w-full">
        <p className="text-[20px] font-bold text-deep-onyx dark:text-pure-mist text-center">
          Check your email
        </p>
        <p className="text-[14px] text-gray600 text-center dark:text-gray500 mt-3">
          If an account exists with{" "}
          <span className="font-medium text-deep-onyx dark:text-pure-mist">
            {email.trim().toLowerCase()}
          </span>
          , a password reset link has been sent. The link expires in 15 minutes.
        </p>
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="min-h-[40px] w-full mt-[25px] py-2 rounded-[10px] border border-gray-300 dark:border-pure-mist text-deep-onyx dark:text-pure-mist text-[12px] font-semibold bg-white dark:bg-deep-onyx hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
        >
          {isResending ? (
            <Spinner className="border-deep-onyx dark:border-pure-mist" />
          ) : (
            <span className="text-[12px]">Resend reset link</span>
          )}
        </button>
        <Link
          href="/auth/login"
          className="min-h-[40px] w-full mt-[12px] py-2 rounded-[10px] bg-serene-purple text-white text-[12px] transition flex items-center justify-center cursor-pointer"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center justify-center h-full w-full"
    >
      <div className="flex flex-col p-6 md:w-[400px] w-full">
        <p className="text-[20px] font-bold text-deep-onyx dark:text-pure-mist text-center">
          Forgot password?
        </p>
        <p className="text-[14px] text-gray600 text-center dark:text-gray500 mb-2">
          Enter your email and we&apos;ll send you a reset link.
        </p>
        <div className="flex flex-col mt-[25px]">
          <div className="flex flex-col">
            <p className="text-[14px] font-[500] ml-[2px] text-gray600 dark:text-pure-mist">
              Email
            </p>
            <CustomInput
              id="email"
              autoComplete="email"
              type="email"
              placeholder="elysium@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-[2px] min-h-[40px]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="min-h-[40px] w-full mt-[20px] py-2 rounded-[10px] bg-serene-purple text-white text-[12px] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {isLoading ? (
              <Spinner className="border-white dark:border-deep-onyx" />
            ) : (
              <span className="text-[12px]">Send reset link</span>
            )}
          </button>

          <div className="flex items-center justify-center mt-[10px]">
            <Link
              href="/auth/login"
              className="text-ecnavy dark:text-pure-mist hover:underline text-[13px] mt-1 mb-4"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
