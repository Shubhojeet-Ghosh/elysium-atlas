"use client";

import { useState } from "react";
import { useAppSelector, useAppDispatch } from "@/store";
import CustomInput from "@/components/inputs/CustomInput";
import Spinner from "@/components/ui/Spinner";
import nodeExpressAxios from "@/utils/node_express_apis";
import Cookies from "js-cookie";
import { toast } from "sonner";
import {
  setFirstName as setFirstNameAction,
  setLastName as setLastNameAction,
  setProfilePicture as setProfilePictureAction,
  setIsProfileComplete as setIsProfileCompleteAction,
  setUserID as setUserIDAction,
  setUserEmail as setUserEmailAction,
} from "@/store/reducers/userProfileSlice";

export default function CompleteProfile() {
  const dispatch = useAppDispatch();
  const isProfileComplete = useAppSelector(
    (state: any) => state.userProfile.isProfileComplete
  );
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Don't render if profile is complete
  if (isProfileComplete) {
    return null;
  }

  const validateForm = () => {
    const newErrors = {
      firstName: "",
      lastName: "",
      password: "",
    };

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedPassword = password.trim();

    // Check first name first
    if (!trimmedFirstName) {
      newErrors.firstName = "First name is required";
      setErrors(newErrors);
      toast.error("First name is required", {
        position: "top-center",
      });
      return false;
    }

    // Then check password
    if (!trimmedPassword) {
      newErrors.password = "Password is required";
      setErrors(newErrors);
      toast.error("Password is required", {
        position: "top-center",
      });
      return false;
    } else if (trimmedPassword.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      setErrors(newErrors);
      toast.error("Password must be at least 8 characters", {
        position: "top-center",
      });
      return false;
    }

    setErrors(newErrors);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Trim all values
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedPassword = password.trim();

    try {
      const updatePayload = {
        first_name: trimmedFirstName,
        last_name: trimmedLastName,
        password: trimmedPassword,
        profile_image_url: "",
      };

      // Get token from cookies
      const sessionToken = Cookies.get("elysium_atlas_session_token");

      const res = await nodeExpressAxios.post(
        "/elysium-atlas/v1/auth/profile/update",
        updatePayload,
        {
          headers: {
            Authorization: `Bearer ${sessionToken || ""}`,
          },
        }
      );

      const response_data = res.data;

      if (response_data.success) {
        // Update cookie with new sessionToken
        Cookies.set("elysium_atlas_session_token", response_data.sessionToken, {
          path: "/",
          expires: 30,
        });

        // Update Redux state with user data
        dispatch(setUserIDAction(response_data?.user?.user_id || ""));
        dispatch(setUserEmailAction(response_data?.user?.email || ""));
        dispatch(setFirstNameAction(response_data?.user?.first_name || ""));
        dispatch(setLastNameAction(response_data?.user?.last_name || ""));
        dispatch(
          setProfilePictureAction(response_data?.user?.profile_image_url || "")
        );
        dispatch(
          setIsProfileCompleteAction(response_data?.is_profile_complete ?? true)
        );

        toast.success(
          response_data.message || "Profile updated successfully!",
          {
            position: "top-center",
          }
        );
      } else {
        toast.error(response_data.message || "Failed to update profile", {
          position: "top-center",
        });
      }
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(
        error?.response?.data?.message ||
          "We are facing some issues, please try again later",
        {
          position: "top-center",
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[1px]">
      <div className="relative w-full max-w-md mx-4 bg-pure-mist dark:bg-deep-onyx rounded-lg  shadow-lg">
        <div className="p-6">
          <div className="mb-4 flex items-center justify-center">
            <h2 className="text-[16px] font-semibold text-deep-onyx dark:text-pure-mist">
              Complete Your Profile...
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mt-[20px]">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-[13px] font-medium text-deep-onyx dark:text-pure-mist mb-1"
                >
                  First Name <span className="text-danger-red">*</span>
                </label>
                <CustomInput
                  id="firstName"
                  type="text"
                  placeholder="Enter your first name"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (errors.firstName) {
                      setErrors({ ...errors, firstName: "" });
                    }
                  }}
                  className={
                    errors.firstName
                      ? "border-danger-red min-h-[45px] "
                      : "min-h-[45px] "
                  }
                  autoComplete="off"
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-[13px] font-medium text-deep-onyx dark:text-pure-mist mb-1"
                >
                  Last Name
                </label>
                <CustomInput
                  id="lastName"
                  type="text"
                  placeholder="Enter your last name"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (errors.lastName) {
                      setErrors({ ...errors, lastName: "" });
                    }
                  }}
                  className={
                    errors.lastName
                      ? "border-danger-red min-h-[45px] "
                      : "min-h-[45px] "
                  }
                  autoComplete="off"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[13px] font-medium text-deep-onyx dark:text-pure-mist mb-1"
              >
                Password <span className="text-danger-red">*</span>
              </label>
              <CustomInput
                id="password"
                type={showPwd ? "text" : "password"}
                placeholder="Enter your password (min 8 characters)"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) {
                    setErrors({ ...errors, password: "" });
                  }
                }}
                className={
                  errors.password
                    ? "border-danger-red min-h-[45px] "
                    : "min-h-[45px] "
                }
                autoComplete="off"
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
              disabled={isSubmitting}
              className="mt-[20px] text-[13px] cursor-pointer w-full bg-serene-purple text-pure-mist min-h-[45px] px-4 rounded-[10px] font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Spinner className="border-white dark:border-deep-onyx" />
              ) : (
                <span>Complete Profile</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
