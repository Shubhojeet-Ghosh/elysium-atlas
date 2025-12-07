"use client";
import { useState, useEffect } from "react";
import CustomInput from "@/components/inputs/CustomInput";
import Spinner from "@/components/ui/Spinner";
import { toast } from "sonner";
import { User } from "lucide-react";
import { useRef } from "react";
import nodeExpressAxios from "@/utils/node_express_apis";
import fastApiAxios from "@/utils/fastapi_axios";
import { useAppDispatch, useAppSelector } from "@/store";
import Cookies from "js-cookie";
import Image from "next/image";
import {
  setFirstName,
  setLastName,
  setProfilePicture,
  setIsProfileComplete,
  setUserID,
  setUserEmail,
} from "@/store/reducers/userProfileSlice";
export default function ProfileCompletionPrompt() {
  const inputRef = useRef();
  const dispatch = useAppDispatch();
  const [showPrompt, setShowPrompt] = useState(false);

  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const firstName = useAppSelector((state) => state.userProfile.firstName);
  const lastName = useAppSelector((state) => state.userProfile.lastName);
  const profilePicture = useAppSelector(
    (state) => state.userProfile.profilePicture
  );
  const isProfileComplete = useAppSelector(
    (state) => state.userProfile.isProfileComplete
  );
  useEffect(() => {
    // Show prompt logic
    if (!isProfileComplete) {
      setShowPrompt(true);
    }
    if (profilePicture) {
      setImagePreviewUrl(profilePicture);
    }
  }, [isProfileComplete, profilePicture]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
      console.log(url);
    } else {
      setImagePreviewUrl("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !password) {
      toast.error("First Name and Password are required!");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long!");
      return;
    }

    setIsLoading(true);

    let profileImageUrlToUse = imagePreviewUrl;
    const token = Cookies.get("elysium_atlas_session_token");

    try {
      if (imageFile && !imagePreviewUrl.startsWith("http")) {
        // 1. Request presigned URL from FastAPI
        const getPresigned = await fastApiAxios.post(
          "/fastapi-playground/elysium-atlas/generate-profile-image-presigned-url",
          {
            file_name: imageFile.name,
            file_type: imageFile.type,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const { presigned_url, cdn_url } = getPresigned.data;
        console.log("Uploading image to S3 via presigned_url", presigned_url);
        // 2. Upload image to S3 via presigned_url
        await fetch(presigned_url, {
          method: "PUT",
          headers: {
            "Content-Type": imageFile.type,
          },
          body: imageFile,
        });
        console.log("Uploaded image to S3 via presigned_url", presigned_url);

        // 3. Use cdn_url as the final profile image URL
        profileImageUrlToUse = cdn_url;
        dispatch(setProfilePicture(profileImageUrlToUse));
      }

      // **Now send your profile completion POST as before, but with the S3 url**
      const res = await nodeExpressAxios.post(
        "/elysium-atlas/v1/auth/auth/profile/update",
        {
          first_name: firstName,
          last_name: lastName,
          password: password,
          profile_image_url: profileImageUrlToUse,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const response_data = res.data;
      if (response_data.success) {
        toast.success("Profile completed!", { position: "top-center" });

        setShowPrompt(false);
        dispatch(setProfilePicture(profileImageUrlToUse));
        dispatch(setUserID(response_data?.user?.user_id || ""));
        dispatch(setUserEmail(response_data?.user?.email || ""));
        dispatch(setFirstName(firstName));
        dispatch(setLastName(lastName));
        dispatch(setIsProfileComplete(true));
      } else {
        toast.error(response_data.message);
      }
    } catch (err) {
      console.log(err);
      toast.error("Could not complete profile. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px] z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md flex flex-col gap-4"
      >
        <p className="text-[14px] font-bold text-center mb-2">
          Complete Your Profile
        </p>

        <div className="flex flex-col items-center">
          <div
            className="relative w-20 h-20 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center cursor-pointer transition"
            onClick={() => inputRef.current && inputRef.current.click()}
            tabIndex={0}
            role="button"
            aria-label="Upload profile image"
          >
            {imagePreviewUrl ? (
              // use next js image component
              <Image
                src={imagePreviewUrl}
                alt="Profile Preview"
                className="w-20 h-20 rounded-full object-cover"
                width={80}
                height={80}
              />
            ) : (
              <User size={42} className="text-gray-400" />
            )}
            <input
              ref={inputRef}
              id="profile_image_input"
              type="file"
              accept=".jpeg,.jpg,.png,image/jpeg,image/png"
              onChange={handleImageChange}
              style={{ display: "none" }}
              tabIndex={-1}
            />
            <span className="absolute bottom-0 right-0 w-6 h-6 bg-deep-onyx rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
              +
            </span>
          </div>
        </div>
        {/* First Name */}
        <label className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="mb-1 text-[13px] ml-[2px]">First Name</span>
            <span className="mb-1 text-red-500 text-[13px]">*</span>
          </div>

          <CustomInput
            id="first_name"
            type="text"
            placeholder="Enter your first name"
            required
            value={firstName}
            onChange={(e) => dispatch(setFirstName(e.target.value))}
            className="mt-[2px] min-h-[40px]"
            autoComplete="off"
          />
        </label>
        {/* Last Name */}
        <label className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="mb-1 text-[13px] ml-[2px]">Last Name</span>
          </div>
          <CustomInput
            id="last_name"
            type="text"
            placeholder="Enter your last name"
            value={lastName}
            onChange={(e) => dispatch(setLastName(e.target.value))}
            className="mt-[2px] min-h-[40px]"
            autoComplete="off"
          />
        </label>
        {/* Password */}
        <label className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="mb-1 text-[13px] ml-[2px]">Password</span>
            <span className="mb-1 text-red-500 text-[13px]">*</span>
          </div>
          <CustomInput
            id="password"
            type={showPwd ? "text" : "password"}
            placeholder="Choose a password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-[2px] min-h-[40px]"
            autoComplete="off"
          />
          <label className="flex items-center gap-2 mt-2 text-[13px] text-gray-600 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={showPwd}
              onChange={() => setShowPwd((prev) => !prev)}
              className="accent-deep-onyx"
            />
            Show password
          </label>
        </label>
        <button
          type="submit"
          className="min-h-[40px] w-full mt-[20px] py-2 rounded-[10px] bg-deep-onyx text-white text-[12px] transition flex items-center justify-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <Spinner className="border-white" />
          ) : (
            <span>Complete Profile...</span>
          )}
        </button>
      </form>
    </div>
  );
}
