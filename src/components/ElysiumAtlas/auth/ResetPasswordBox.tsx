"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import CustomInput from "@/components/inputs/CustomInput";
import Spinner from "@/components/ui/Spinner";
import { resetPassword } from "@/utils/authApi";

interface ResetPasswordBoxProps {
  token: string | null;
}

export default function ResetPasswordBox({ token }: ResetPasswordBoxProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!token) {
    return (
      <div className="flex flex-col p-6 md:w-[400px] w-full">
        <p className="text-[20px] font-bold text-deep-onyx dark:text-pure-mist text-center">
          Invalid reset link
        </p>
        <p className="text-[14px] text-gray600 text-center dark:text-gray500 mt-3">
          This password reset link is missing or invalid.
        </p>
        <Link
          href="/auth/forgot-password"
          className="min-h-[40px] w-full mt-[25px] py-2 rounded-[10px] bg-serene-purple text-white text-[12px] transition flex items-center justify-center cursor-pointer"
        >
          Request a new link
        </Link>
        <div className="flex items-center justify-center mt-[10px]">
          <Link
            href="/auth/login"
            className="text-ecnavy dark:text-pure-mist hover:underline text-[13px] mt-1"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedPassword) {
      toast.error("Please enter a new password", { position: "top-center" });
      return;
    }

    if (trimmedPassword.length < 8) {
      toast.error("Password must be at least 8 characters", {
        position: "top-center",
      });
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      toast.error("Passwords do not match", { position: "top-center" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await resetPassword(token, trimmedPassword);

      if (response.success) {
        toast.success(
          response.message ||
            "Password reset successfully. You can now log in.",
          { position: "top-center" },
        );
        router.push("/auth/login");
      } else {
        toast.error(response.message || "Something went wrong.", {
          position: "top-center",
        });
      }
    } catch {
      toast.error("We are facing some issues, please try again later", {
        position: "top-center",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center justify-center h-full w-full"
    >
      <div className="flex flex-col p-6 md:w-[400px] w-full">
        <p className="text-[20px] font-bold text-deep-onyx dark:text-pure-mist text-center">
          Reset password
        </p>
        <p className="text-[14px] text-gray600 text-center dark:text-gray500 mb-2">
          Enter your new password below.
        </p>
        <div className="flex flex-col mt-[25px]">
          <div className="flex flex-col">
            <p className="text-[14px] font-[500] ml-[2px] text-gray600 dark:text-pure-mist">
              New password
            </p>
            <CustomInput
              id="password"
              autoComplete="new-password"
              type={showPwd ? "text" : "password"}
              placeholder="Your new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-[2px] min-h-[40px]"
            />
          </div>

          <div className="flex flex-col mt-3">
            <p className="text-[14px] font-[500] ml-[2px] text-gray600 dark:text-pure-mist">
              Confirm password
            </p>
            <CustomInput
              id="confirm-password"
              autoComplete="new-password"
              type={showPwd ? "text" : "password"}
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-[2px] min-h-[40px]"
            />
            <label className="flex items-center gap-2 mt-2 text-[13px] text-gray-600 dark:text-pure-mist select-none cursor-pointer">
              <input
                type="checkbox"
                checked={showPwd}
                onChange={() => setShowPwd((prev) => !prev)}
                className="accent-deep-onyx"
              />
              Show password
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="min-h-[40px] w-full mt-[20px] py-2 rounded-[10px] bg-serene-purple text-white text-[12px] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
          >
            {isLoading ? (
              <Spinner className="border-white dark:border-deep-onyx" />
            ) : (
              <span className="text-[12px]">Reset password</span>
            )}
          </button>

          <div className="flex items-center justify-center mt-[10px]">
            <Link
              href="/auth/forgot-password"
              className="text-ecnavy dark:text-pure-mist hover:underline text-[13px] mt-1 mb-4"
            >
              Request a new link
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}
