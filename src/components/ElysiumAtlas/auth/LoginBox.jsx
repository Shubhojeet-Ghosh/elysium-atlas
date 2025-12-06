"use client";
import { useState, useEffect } from "react";
import CustomInput from "@/components/inputs/CustomInput";
import { GoogleIcon } from "@/components/TechStacks/Icons.tsx";
import { toast } from "sonner";
import nodeExpressAxios from "@/utils/node_express_apis";
import Spinner from "@/components/ui/Spinner";
import Cookies from "js-cookie";
import { useAppDispatch } from "@/store";
import {
  setFirstName,
  setLastName,
  setProfilePicture,
  setIsProfileComplete,
  resetUserProfile,
} from "@/store/reducers/userProfileSlice";

import {
  openGoogleOAuth,
  getGoogleAccessTokenFromHash,
} from "@/utils/googleAuth";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const REDIRECT_URI =
  typeof window !== "undefined"
    ? window.location.origin + "/elysium-atlas/auth/login"
    : "";

export default function LoginBox() {
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const dispatch = useAppDispatch();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    if (!email) {
      toast.error("Please enter your email", {
        position: "top-center",
      });
      setIsLoading(false);
      return;
    }
    try {
      const loginPayload = {
        email: email.trim().toLowerCase(),
      };
      if (showPassword && password) {
        loginPayload.password = password;
      }
      const res = await nodeExpressAxios.post(
        "/elysium-atlas/v1/auth/magic-link",
        loginPayload
      );
      // console.log(res);
      const response_data = res.data;
      if (response_data.success) {
        if (response_data.user) {
          Cookies.set(
            "elysium_atlas_session_token",
            response_data.sessionToken,
            {
              path: "/",
              expires: 30,
            }
          );

          dispatch(
            setProfilePicture(response_data?.user?.profile_image_url || "")
          );
          dispatch(setFirstName(response_data?.user?.first_name || ""));
          dispatch(setLastName(response_data?.user?.last_name || ""));
          dispatch(
            setIsProfileComplete(response_data?.is_profile_complete ?? true)
          );

          toast.success("Logged in successfully!", {
            position: "top-center",
          });

          setTimeout(() => {
            window.location.href = "/elysium-atlas/my-agents";
          }, 150);
        } else {
          toast.success("Magic link sent to your email", {
            position: "top-center",
          });
        }
      } else {
        toast.error(response_data.message, {
          position: "top-center",
        });
      }
    } catch {
      toast.error("We are facing some issues, please try again later", {
        position: "top-center",
      });
      // console.log(error);
    } finally {
      setIsLoading(false);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    dispatch(resetUserProfile());
    const verifyGoogleLogin = async () => {
      try {
        const accessToken = getGoogleAccessTokenFromHash();

        if (accessToken) {
          setIsLoading(true);
          console.log("Google access token:", accessToken);
          const res = await nodeExpressAxios.post(
            "/elysium-atlas/v1/auth/verify-google-login",
            {
              access_token: accessToken,
            }
          );
          const response_data = res.data;
          if (response_data.success) {
            Cookies.set(
              "elysium_atlas_session_token",
              response_data.sessionToken,
              {
                path: "/",
                expires: 30,
              }
            );

            dispatch(
              setProfilePicture(response_data?.user?.profile_image_url || "")
            );
            dispatch(setFirstName(response_data?.user?.first_name || ""));
            dispatch(setLastName(response_data?.user?.last_name || ""));
            dispatch(
              setIsProfileComplete(response_data?.is_profile_complete ?? true)
            );
            toast.success("Logged in successfully!", {
              position: "top-center",
            });
            setTimeout(() => {
              window.location.href = "/elysium-atlas/my-agents";
            }, 150);
          } else {
            toast.error(response_data.message, {
              position: "top-center",
            });
          }
        }
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };
    verifyGoogleLogin();
  }, [dispatch]);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    console.log("Redirect URI:", REDIRECT_URI);
    openGoogleOAuth({
      clientId: GOOGLE_CLIENT_ID,
      redirectUri: REDIRECT_URI,
    });
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
          Log into your account to get going...
        </p>
        <div className="flex flex-col mt-[25px]">
          <div className="flex flex-col">
            <p className="text-[14px] font-[500] ml-[2px] text-gray600 dark:text-pure-mist">
              Email
            </p>
            <CustomInput
              id="email"
              autoComplete="off"
              type="email"
              placeholder="elysium@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-[2px] min-h-[40px] "
            />
          </div>
          {showPassword && (
            <div className="flex flex-col mt-3">
              <p className="text-[14px] font-[500] ml-[2px] text-gray600 dark:text-pure-mist">
                Password
              </p>
              <CustomInput
                id="password"
                autoComplete="off"
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
          )}

          <button
            type="submit"
            onClick={handleSubmit}
            className="min-h-[40px] w-full mt-[20px] py-2 rounded-[10px] bg-serene-purple  text-white text-[12px] transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <Spinner className="border-white dark:border-deep-onyx" />
            ) : (
              <span className="text-[12px]">
                {showPassword ? "Log in..." : "Send Link..."}
              </span>
            )}
          </button>
          <div className="flex items-center justify-end mt-[10px]">
            {!showPassword && (
              <button
                type="button"
                className="text-ecnavy dark:text-pure-mist hover:underline text-[13px] mt-1 mb-4 cursor-pointer"
                tabIndex={0}
                onClick={() => setShowPassword(true)}
              >
                Log in using password...
              </button>
            )}
            {showPassword && (
              <button
                type="button"
                className="text-ecnavy dark:text-pure-mist hover:underline text-[13px] mt-1 mb-4 cursor-pointer"
                tabIndex={0}
                onClick={() => setShowPassword(false)}
              >
                Log in using Magic Link...
              </button>
            )}
          </div>
          <div className="flex items-center w-full mt-[20px]">
            <div className="flex-grow border-t border-gray-300 dark:border-pure-mist" />
            <span className="mx-2 text-gray-500 dark:text-pure-mist text-sm">
              or
            </span>
            <div className="flex-grow border-t border-gray-300 dark:border-pure-mist" />
          </div>
          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="min-h-[40px] mt-[20px] w-full flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-[10px] text-[12px] font-semibold text-gray-700 bg-white hover:bg-gray-50 transition mb-2 cursor-pointer"
          >
            <GoogleIcon />
            <span className="text-[12px] ">Continue with Google</span>
          </button>
        </div>
      </div>
    </form>
  );
}
