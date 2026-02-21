"use client";

import { useState, useEffect, useRef } from "react";
import {
  CustomTabs,
  CustomTabsList,
  CustomTabsTrigger,
} from "@/components/ui/CustomTabs";
import { Link, Image } from "lucide-react";
import AgentAvatarLinkTab from "./AgentAvatarLinkTab";
import AgentAvatarImageTab from "./AgentAvatarImageTab";
import { useAppDispatch, useAppSelector } from "@/store";
import { setAgentIcon } from "@/store/reducers/agentSlice";

interface AgentAvatarRightProps {
  avatarFile: File | null;
  setAvatarFile: (file: File | null) => void;
  clearSignal: number;
}

export default function AgentAvatarRight({
  avatarFile,
  setAvatarFile,
  clearSignal,
}: AgentAvatarRightProps) {
  const dispatch = useAppDispatch();
  const agentIcon = useAppSelector((state) => state.agent.agent_icon);
  const initialized = useRef(false);
  // Always-current ref so the clearSignal effect reads the post-clear Redux value
  const agentIconRef = useRef(agentIcon);
  useEffect(() => {
    agentIconRef.current = agentIcon;
  });

  const [activeTab, setActiveTab] = useState("link");
  const [imageUrl, setImageUrl] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  // Seed state once when agent_icon first arrives from Redux (API fetch)
  useEffect(() => {
    if (initialized.current || !agentIcon) return;
    initialized.current = true;

    if (agentIcon.startsWith("data:")) {
      setPreview(agentIcon);
      setActiveTab("image");
    } else {
      setImageUrl(agentIcon);
      setActiveTab("link");
    }
  }, [agentIcon]);

  // When switching to the link tab, seed imageUrl from agentIcon if it's a plain URL
  // (covers the case where the user saved an avatar via the image tab — CDN URL is in
  // Redux but imageUrl is still empty because seeding only runs once at init)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (
      activeTab === "link" &&
      !imageUrl &&
      agentIcon &&
      !agentIcon.startsWith("data:")
    ) {
      setImageUrl(agentIcon);
    }
  }, [activeTab]);

  // Re-seed when parent signals a clear
  useEffect(() => {
    if (clearSignal === 0) return;
    const icon = agentIconRef.current;
    if (!icon) {
      setImageUrl("");
      setPreview(null);
      setActiveTab("link");
    } else if (icon.startsWith("data:")) {
      setPreview(icon);
      setImageUrl("");
      setActiveTab("image");
    } else {
      setImageUrl(icon);
      setPreview(null);
      setActiveTab("link");
    }
  }, [clearSignal]);

  const handleSetImageUrl = (url: string) => {
    setImageUrl(url);
    setPreview(null);
  };

  const handleSetPreview = (dataUrl: string | null) => {
    setPreview(dataUrl);
    setImageUrl("");
    if (!dataUrl) dispatch(setAgentIcon(null));
  };

  return (
    <div className="lg:w-[60%] w-full flex flex-col items-center p-[24px] gap-[20px]">
      <CustomTabs value={activeTab} onValueChange={setActiveTab}>
        <CustomTabsList className="w-fit">
          <CustomTabsTrigger
            value="link"
            className="flex items-center gap-2 font-[600]"
          >
            <Link size={14} />
            Link
          </CustomTabsTrigger>
          <CustomTabsTrigger
            value="image"
            className="flex items-center gap-2 font-[600]"
          >
            <Image size={14} />
            Image
          </CustomTabsTrigger>
        </CustomTabsList>
      </CustomTabs>

      <div
        className={`w-full max-w-[480px] ${activeTab === "link" ? "block" : "hidden"}`}
      >
        <AgentAvatarLinkTab
          imageUrl={imageUrl}
          setImageUrl={handleSetImageUrl}
          isActive={activeTab === "link"}
        />
      </div>

      <div
        className={`w-full max-w-[480px] ${activeTab === "image" ? "block" : "hidden"}`}
      >
        <AgentAvatarImageTab
          preview={preview}
          setPreview={handleSetPreview}
          avatarFile={avatarFile}
          setAvatarFile={setAvatarFile}
        />
      </div>
    </div>
  );
}
