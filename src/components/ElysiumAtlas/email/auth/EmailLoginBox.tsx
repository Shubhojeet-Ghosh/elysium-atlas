"use client";

import { useEffect, useState } from "react";
import CustomInput from "@/components/inputs/CustomInput";
import { toast } from "sonner";
import fastApiAxios from "@/utils/fastapi_axios";
import Spinner from "@/components/ui/Spinner";
import Cookies from "js-cookie";
import { useAppDispatch } from "@/store";
import {
  resetEmailUser,
  setEmailUser,
} from "@/store/reducers/emailUserSlice";
import { resetEmailDepartments } from "@/store/reducers/emailDepartmentsSlice";
import { parseEmailUserRole } from "@/store/types/EmailUserTypes";

const EMAIL_SESSION_COOKIE = "email-session-token";

export default function EmailLoginBox() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(resetEmailUser());
    dispatch(resetEmailDepartments());
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email.trim()) {
      toast.error("Please enter your email", { position: "top-center" });
      setIsLoading(false);
      return;
    }

    if (!password) {
      toast.error("Please enter your password", { position: "top-center" });
      setIsLoading(false);
      return;
    }

    try {
      const res = await fastApiAxios.post(
        "/elysium-agents/email-auth/v1/login",
        {
          email: email.trim().toLowerCase(),
          password,
        },
      );

      const responseData = res.data;

      if (responseData.success && responseData.token && responseData.user) {
        Cookies.set(EMAIL_SESSION_COOKIE, responseData.token, {
          path: "/",
          expires: 30,
        });

        dispatch(
          setEmailUser({
            userID: responseData.user.user_id || "",
            name: responseData.user.name || "",
            email: responseData.user.email || "",
            teamID: responseData.user.team_id || "",
            departmentID: responseData.user.department_id || "",
            departmentName: responseData.user.department_name || "",
            role: parseEmailUserRole(
              responseData.user.role || responseData.decoded_token?.role,
            ),
          }),
        );

        toast.success("Logged in successfully!", { position: "top-center" });

        setTimeout(() => {
          window.location.href = "/email/ai-agents";
        }, 150);
      } else {
        toast.error(responseData.message || "Login failed", {
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
          : "We are facing some issues, please try again later";

      toast.error(message, { position: "top-center" });
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
          Welcome Back!
        </p>
        <p className="text-[14px] text-gray600 text-center dark:text-gray500 mb-2">
          Log into your email agent account...
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
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-[2px] min-h-[40px]"
            />
          </div>

          <div className="flex flex-col mt-3">
            <p className="text-[14px] font-[500] ml-[2px] text-gray600 dark:text-pure-mist">
              Password
            </p>
            <CustomInput
              id="password"
              autoComplete="current-password"
              type={showPwd ? "text" : "password"}
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            className="min-h-[40px] w-full mt-[20px] py-2 rounded-[10px] bg-serene-purple text-white text-[12px] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Spinner className="border-white dark:border-deep-onyx" />
            ) : (
              <span className="text-[12px]">Log in...</span>
            )}
          </button>
          {/* <p className="text-center text-[13px] text-gray-600 dark:text-gray-400 mt-2">
            Need an account?{" "}
            <Link
              href="/email/auth/register-user"
              className="text-serene-purple hover:underline font-medium"
            >
              Register user
            </Link>
          </p> */}
        </div>
      </div>
    </form>
  );
}
