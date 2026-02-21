"use client";

import { useState, useRef, useEffect } from "react";
import { Link } from "lucide-react";
import CustomInput from "@/components/inputs/CustomInput";
import { useAppDispatch, useAppSelector } from "@/store";
import { setAgentIcon } from "@/store/reducers/agentSlice";

interface AgentAvatarLinkTabProps {
  imageUrl: string;
  setImageUrl: (value: string) => void;
  isActive: boolean;
}

export default function AgentAvatarLinkTab({
  imageUrl,
  setImageUrl,
  isActive,
}: AgentAvatarLinkTabProps) {
  const dispatch = useAppDispatch();
  const agentIcon = useAppSelector((state) => state.agent.agent_icon);
  // Snapshot the icon value at mount — used to restore when the URL is invalid or cleared
  const originalIconRef = useRef<string | null>(agentIcon);

  const [imgValid, setImgValid] = useState(false);
  const [imgTried, setImgTried] = useState(false);

  // Track the previous imageUrl value so we can distinguish between:
  //   a) the user explicitly clearing an entered URL (prev non-empty → empty) → restore
  //   b) the link tab becoming active while imageUrl was already empty (tab switch) → no restore
  const prevImageUrlRef = useRef(imageUrl);

  useEffect(() => {
    const prev = prevImageUrlRef.current;
    // Only restore when the user cleared an input they had previously typed
    if (isActive && prev && !imageUrl) {
      dispatch(setAgentIcon(originalIconRef.current));
    }
    prevImageUrlRef.current = imageUrl;
  }, [imageUrl, isActive, dispatch]);

  return (
    <div className="flex flex-row items-center gap-[16px] w-full border border-border rounded-[12px] p-[16px]">
      {/* Icon / Preview */}
      <div className="shrink-0 w-[40px] h-[40px] rounded-full bg-muted flex items-center justify-center overflow-hidden">
        {imageUrl && imgValid ? (
          <img
            src={imageUrl}
            alt="Avatar preview"
            width={40}
            height={40}
            className="rounded-full w-[40px] h-[40px] object-cover"
          />
        ) : (
          <Link size={16} className="text-muted-foreground" />
        )}
        {imageUrl && (
          <img
            key={imageUrl}
            src={imageUrl}
            alt=""
            className="hidden"
            onLoad={() => {
              setImgValid(true);
              setImgTried(true);
              dispatch(setAgentIcon(imageUrl));
            }}
            onError={() => {
              setImgValid(false);
              setImgTried(true);
              // Restore original — don't create a diff for an invalid URL
              dispatch(setAgentIcon(originalIconRef.current));
            }}
          />
        )}
      </div>

      {/* Label + Input */}
      <div className="flex flex-col gap-[6px] flex-1">
        <p className="text-[13px] font-[600]">Image URL</p>
        <CustomInput
          placeholder="https://example.com/avatar.png"
          value={imageUrl}
          onChange={(e) => {
            setImgValid(false);
            setImgTried(false);
            // Don't dispatch here — wait for probe onLoad/onError to confirm validity
            setImageUrl(e.target.value.trimStart());
          }}
          inputClassName="font-[400] px-[12px] py-[8px]"
        />
        {imageUrl && imgTried && !imgValid && (
          <p className="text-[11px] text-red-400 text-right">
            Could not load image from this URL
          </p>
        )}
      </div>
    </div>
  );
}
