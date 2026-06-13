"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import nodeExpressAxios from "@/utils/node_express_apis";
import { getRedirectUrl } from "@/utils/redirectUtils";
import Link from "next/link";
import Logo from "@/components/ElysiumAtlas/LogoComponent";
import Spinner from "@/components/ui/Spinner";
import { useAppDispatch } from "@/store";
import {
  handlePhase1LoginResult,
  parsePhase1LoginResponse,
} from "@/utils/authLogin";

function VerifyPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(!!token);
  const [message, setMessage] = useState<string>("");
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) return;

      setLoading(true);
      setMessage("");
      try {
        const res = await nodeExpressAxios.post(
          "elysium-atlas/v1/auth/verify",
          { token },
        );
        const loginResult = parsePhase1LoginResponse(res.data);

        if (loginResult.type === "error") {
          setMessage("Verification failed...");
          toast.error(loginResult.message || "Verification failed.");
          return;
        }

        const outcome = handlePhase1LoginResult(
          dispatch,
          loginResult,
          getRedirectUrl(),
        );

        if (outcome === "direct") {
          setMessage("Verification successful, redirecting to your account...");
          toast.success("Account verified! Redirecting you to your account...");
          setVerificationSuccess(true);
        } else if (outcome === "team_selection") {
          window.location.replace("/auth/login");
        }
      } catch {
        setMessage("Link expired, please login again.");
        toast.error("Verification failed.");
      } finally {
        setLoading(false);
      }
    };

    if (token) verifyToken();
  }, [token, dispatch]);

  return (
    <>
      <div className="flex flex-col items-start justify-center w-full px-[18px] py-[10px]">
        <Logo />
      </div>
      <div className="flex items-center justify-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="bg-white p-8 min-w-[320px] flex flex-col items-center">
          {loading ? (
            <p className="text-[14px] font-bold">Verifying your account...</p>
          ) : verificationSuccess ? (
            <p className="text-[14px] font-bold">{message}</p>
          ) : (
            <p className="text-[14px] font-bold">
              Magic link expired. Please{" "}
              <Link href="/auth/login" className="text-eclightblue">
                login
              </Link>{" "}
              again...
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[200px]">
          <Spinner className="border-deep-onyx dark:border-pure-mist" />
        </div>
      }
    >
      <VerifyPageContent />
    </Suspense>
  );
}
