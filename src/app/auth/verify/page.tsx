"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import nodeExpressAxios from "@/utils/node_express_apis";
import { getRedirectUrl } from "@/utils/redirectUtils";
import Link from "next/link";
import Logo from "@/components/ElysiumAtlas/LogoComponent";
import Cookies from "js-cookie";
import { useAppDispatch } from "@/store";
import {
  setFirstName,
  setLastName,
  setProfilePicture,
  setIsProfileComplete,
  setUserID,
  setUserEmail,
} from "@/store/reducers/userProfileSlice";
export default function VerifyPage() {
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
        const res: any = await nodeExpressAxios.post(
          "elysium-atlas/v1/auth/verify",
          {
            token,
          }
        );
        const { success } = res.data;
        if (success) {
          setMessage("Verification successful, redirecting to your account...");
          toast.success("Account verified! Redirecting you to your account...");
          setVerificationSuccess(true);
          dispatch(setProfilePicture(res.data?.user?.profile_image_url || ""));
          dispatch(setUserID(res.data?.user?.user_id || ""));
          dispatch(setUserEmail(res.data?.user?.email || ""));
          dispatch(setFirstName(res.data?.user?.first_name || ""));
          dispatch(setLastName(res.data?.user?.last_name || ""));
          dispatch(setIsProfileComplete(res.data?.is_profile_complete ?? true));
          Cookies.set("elysium_atlas_session_token", res.data?.sessionToken, {
            path: "/",
            expires: 1,
          });

          setTimeout(() => {
            window.location.href = getRedirectUrl();
          }, 150);
        } else {
          setMessage("Verification failed...");
          toast.error("Verification failed.");
        }
      } catch {
        setMessage("Link expired, please login again.");
        toast.error("Verification failed.");
        // Optionally: console.error(err);
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
      {/* middle of the screen */}
      <div className="flex items-center justify-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="bg-white p-8 min-w-[320px] flex flex-col items-center">
          {loading ? (
            <p className="text-[14px] font-bold">Verifying your account...</p>
          ) : verificationSuccess ? (
            <p className="text-[14px] font-bold">{message}</p>
          ) : (
            <p className="text-[14px] font-bold">
              Magic link expired. Please{" "}
              <Link
                href={"/elysium-atlas/auth/login"}
                className="text-eclightblue"
              >
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
