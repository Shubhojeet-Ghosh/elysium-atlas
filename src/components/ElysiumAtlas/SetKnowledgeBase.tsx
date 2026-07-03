"use client";

import { useState } from "react";
import { CustomTabs } from "@/components/ui/CustomTabs";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { resetAgentBuilder } from "@/store/reducers/agentBuilderSlice";
import KnowledgeBaseNavigation from "./KnowledgeBaseNavigation";
import fastApiAxios from "@/utils/fastapi_axios";
import Cookies from "js-cookie";
import { toast } from "sonner";
import axios from "axios";
import { useRouter } from "next/navigation";
import { buildAgentKbBuildFields } from "@/utils/agentKbUtils";
import {
  createFile,
  generatePresignedUrls,
  parseKbPresignedUrls,
} from "@/utils/kbItemsApi";
import { KbDatasourceModeProvider } from "./kb/KbDatasourceModeContext";
import AgentDataSource, { AgentDataSourceTabs } from "./AgentDataSource";

interface SetKnowledgeBaseProps {
  documentFiles: File[];
  setDocumentFiles: React.Dispatch<React.SetStateAction<File[]>>;
  onBuildRedirectStart?: () => void;
}

export default function SetKnowledgeBase({
  documentFiles,
  setDocumentFiles,
  onBuildRedirectStart,
}: SetKnowledgeBaseProps) {
  const dispatch = useDispatch();
  const router = useRouter();

  const agentName = useSelector(
    (state: RootState) => state.agentBuilder.agentName,
  );
  const agentID = useSelector(
    (state: RootState) => state.agentBuilder.agentID,
  );
  const baseURL = useSelector(
    (state: RootState) => state.agentBuilder.baseURL,
  );
  const knowledgeBaseLinks = useSelector(
    (state: RootState) => state.agentBuilder.knowledgeBaseLinks,
  );
  const knowledgeBaseFiles = useSelector(
    (state: RootState) => state.agentBuilder.knowledgeBaseFiles,
  );
  const knowledgeBaseText = useSelector(
    (state: RootState) => state.agentBuilder.knowledgeBaseText,
  );
  const knowledgeBaseQnA = useSelector(
    (state: RootState) => state.agentBuilder.knowledgeBaseQnA,
  );

  const [activeTab, setActiveTab] = useState("links");
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!agentID) {
      toast.error("Missing agent ID. Please go back and try again.");
      return;
    }

    setIsLoading(true);
    const token = Cookies.get("elysium_atlas_session_token");

    const kbFields = buildAgentKbBuildFields({
      knowledgeBaseLinks,
      knowledgeBaseFiles,
      knowledgeBaseText,
      knowledgeBaseQnA,
    });

    const requestBody: Record<string, unknown> = {
      agent_id: agentID,
      agent_name: agentName,
      ...kbFields,
    };

    if (baseURL?.trim()) {
      requestBody.base_url = baseURL.trim();
    }

    const filesToUpload = documentFiles.filter((file) => {
      const meta = knowledgeBaseFiles.find((f) => f.name === file.name);
      return meta?.status === "new" && meta.checked !== false;
    });

    if (filesToUpload.length > 0) {
      try {
        const newFiles: Array<{ kb_id: string; file_key: string }> = [];

        for (const file of filesToUpload) {
          const createResponse = await createFile(file.name);
          if (!createResponse.success || !createResponse.kb_id) {
            toast.error(
              createResponse.message ||
                `Failed to prepare upload for ${file.name}`,
            );
            setIsLoading(false);
            return;
          }

          const presignedResponse = await generatePresignedUrls(
            createResponse.kb_id,
            [{ file_name: file.name, filetype: file.type }],
          );

          if (!presignedResponse.success) {
            toast.error(
              presignedResponse.message ||
                `Failed to generate upload URL for ${file.name}`,
            );
            setIsLoading(false);
            return;
          }

          const presignedFiles = parseKbPresignedUrls(presignedResponse);
          const presignedFile = presignedFiles.find(
            (entry) => entry.file_name === file.name,
          );

          if (!presignedFile?.upload_url || !presignedFile.file_key) {
            toast.error(`Failed to prepare upload for ${file.name}`);
            setIsLoading(false);
            return;
          }

          await axios.put(presignedFile.upload_url, file, {
            headers: { "Content-Type": file.type },
          });

          newFiles.push({
            kb_id: createResponse.kb_id,
            file_key: presignedFile.file_key,
          });
        }

        requestBody.new_files = newFiles;
        setDocumentFiles([]);
      } catch (error: unknown) {
        const uploadErrorMessage =
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ||
          (error as Error)?.message ||
          "Failed to upload files. Please try again.";
        toast.error(uploadErrorMessage);
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await fastApiAxios.post(
        "/elysium-agents/elysium-atlas/agent/v1/build-agent",
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.data.success === true) {
        const builtAgentId = response.data.agent_id as string;
        onBuildRedirectStart?.();
        toast.success("Setting up your agent... Redirecting shortly.");
        setTimeout(() => {
          router.push(`/my-agents/${builtAgentId}`);
          dispatch(resetAgentBuilder());
        }, 3000);
      } else {
        toast.error(response.data.message || "Failed to build agent");
        setIsLoading(false);
      }
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as Error)?.message ||
        "Failed to build agent. Please try again.";
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/my-agents");
  };

  const hasContent =
    knowledgeBaseLinks.length > 0 ||
    knowledgeBaseFiles.length > 0 ||
    knowledgeBaseText.length > 0 ||
    knowledgeBaseQnA.length > 0;

  return (
    <div className="flex flex-col h-full pb-3">
      <div className="shrink-0">
        <div className="lg:text-[22px] text-[18px] font-bold flex flex-wrap items-center gap-1 md:gap-2 text-deep-onyx dark:text-pure-mist">
          Add knowledge base
        </div>
        <div className="lg:text-[16px] text-[14px] font-semibold mt-[2px] text-gray-500 dark:text-pure-mist">
          Add new sources or pick existing items from your team library
        </div>
      </div>

      <KbDatasourceModeProvider mode="build">
        <div className="flex flex-col flex-1 min-h-0">
          <CustomTabs
            defaultValue="links"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full flex flex-col flex-1 min-h-0"
          >
            <div className="shrink-0 mt-6">
              <AgentDataSourceTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <AgentDataSource
                activeTab={activeTab}
                documentFiles={documentFiles}
                setDocumentFiles={setDocumentFiles}
              />
            </div>
          </CustomTabs>
        </div>
      </KbDatasourceModeProvider>

      <div className="shrink-0 pt-[8px]">
        <KnowledgeBaseNavigation
          onBack={handleBack}
          onContinue={handleContinue}
          hasContent={hasContent}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
