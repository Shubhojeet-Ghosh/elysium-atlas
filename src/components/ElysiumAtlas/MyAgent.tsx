import { useState, useEffect, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import Cookies from "js-cookie";
import { useRouter, useSearchParams } from "next/navigation";
import { CustomTabs } from "@/components/ui/CustomTabs";
import AgentBuilderTabs from "./AgentBuilderTabs";
import AgentMainContent from "./AgentMainContent";
import UnsavedChangesBar from "./UnsavedChangesBar";
import AgentLinks from "./AgentLinks";
import AgentFiles from "./AgentFiles";
import AgentText from "./AgentText";
import AgentQnA from "./AgentQnA";
import { useCurrentAgentDetails } from "./useAgentDetailsCompare";
import { useAppDispatch, useAppSelector } from "@/store";
import PrimaryButton from "../ui/PrimaryButton";
import {
  setAgentName,
  setBaseURL,
  setAgentStatus,
  setAgentCurrentTask,
  setProgress,
  setSystemPrompt,
  setTemperature,
  setWelcomeMessage,
  setLlmModel,
  setKnowledgeBaseLinks,
  setKnowledgeBaseFiles,
  setKnowledgeBaseText,
  setKnowledgeBaseQnA,
  setTriggerGetAgentDetails,
} from "@/store/reducers/agentSlice";
import {
  setChatSessionId,
  setAgentId,
  setConversationChain,
  resetAgentChat,
} from "@/store/reducers/agentChatSlice";
import { mapInitialAgentDetails } from "@/utils/mapInitialAgentDetails";
import fastApiAxios from "@/utils/fastapi_axios";
import { isEquivalent, normalizeValue } from "@/utils/comparisonUtils";
import { toast } from "sonner";
import { SquareArrowOutUpRight } from "lucide-react";
import axios from "axios";

export default function MyAgent({
  initialAgentDetails,
}: {
  initialAgentDetails: any;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const agentID = useAppSelector((state) => state.agent.agentID);

  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get("activeTab") || "agent";
  });

  const [mappedInitial, setMappedInitial] = useState<any>(null);

  /* State lifted from AgentFiles to persist across tab switches */
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);

  const knowledgeBaseLinks = useAppSelector(
    (state) => state.agent.knowledgeBaseLinks
  );

  const knowledgeBaseFiles = useAppSelector(
    (state) => state.agent.knowledgeBaseFiles
  );

  const knowledgeBaseText = useAppSelector(
    (state) => state.agent.knowledgeBaseText
  );

  const knowledgeBaseQnA = useAppSelector(
    (state) => state.agent.knowledgeBaseQnA
  );

  // Initialize mappedInitial from initialAgentDetails
  useEffect(() => {
    if (initialAgentDetails) {
      setMappedInitial(mapInitialAgentDetails(initialAgentDetails));
    }
  }, [initialAgentDetails]);

  // Sync mappedInitial with knowledgeBaseLinks when they are fetched
  // This ensures the "Clear" button preserves existing links and prevents false unsaved changes
  useEffect(() => {
    if (mappedInitial && knowledgeBaseLinks.length > 0) {
      // Only update if knowledgeBaseLinks have "existing" status items
      // (meaning they were fetched from the API, not newly added)
      const existingLinks = knowledgeBaseLinks.filter(
        (link) => link.status === "existing"
      );

      // Only sync if there are existing links and they differ from mappedInitial
      if (existingLinks.length > 0) {
        const currentMappedLinkUrls = new Set(
          mappedInitial.knowledgeBaseLinks.map((l: any) => l.link)
        );
        const fetchedLinkUrls = new Set(existingLinks.map((l) => l.link));

        // Check if the link lists are different (different lengths or different URLs)
        const isDifferent =
          existingLinks.length !== mappedInitial.knowledgeBaseLinks.length ||
          !Array.from(fetchedLinkUrls).every((url) =>
            currentMappedLinkUrls.has(url)
          );

        if (isDifferent) {
          setMappedInitial((prev: any) => ({
            ...prev,
            knowledgeBaseLinks: existingLinks,
          }));
        }
      }
    }
  }, [knowledgeBaseLinks, mappedInitial]);

  // Sync mappedInitial with knowledgeBaseFiles when they are fetched
  // This ensures the "Clear" button preserves existing files and prevents false unsaved changes
  useEffect(() => {
    if (mappedInitial && knowledgeBaseFiles.length > 0) {
      // Only update if knowledgeBaseFiles have "existing" status items
      // (meaning they were fetched from the API, not newly added)
      const existingFiles = knowledgeBaseFiles.filter(
        (file) => file.status === "existing"
      );

      // Only sync if there are existing files and they differ from mappedInitial
      if (existingFiles.length > 0) {
        const currentMappedFileNames = new Set(
          mappedInitial.knowledgeBaseFiles.map((f: any) => f.name)
        );
        const fetchedFileNames = new Set(existingFiles.map((f) => f.name));

        // Check if the file lists are different (different lengths or different names)
        const isDifferent =
          existingFiles.length !== mappedInitial.knowledgeBaseFiles.length ||
          !Array.from(fetchedFileNames).every((name) =>
            currentMappedFileNames.has(name)
          );

        if (isDifferent) {
          setMappedInitial((prev: any) => ({
            ...prev,
            knowledgeBaseFiles: existingFiles,
          }));
        }
      }
    }
  }, [knowledgeBaseFiles, mappedInitial]);

  // Sync mappedInitial with knowledgeBaseText when they are fetched
  // This ensures the "Clear" button preserves existing texts and prevents false unsaved changes
  useEffect(() => {
    if (mappedInitial && knowledgeBaseText.length > 0) {
      // Only update if knowledgeBaseText have "existing" status items
      // (meaning they were fetched from the API, not newly added)
      const existingTexts = knowledgeBaseText.filter(
        (text) => text.status === "existing"
      );

      // Only sync if there are existing texts and they differ from mappedInitial
      if (existingTexts.length > 0) {
        const currentMappedTextAliases = new Set(
          mappedInitial.knowledgeBaseText?.map(
            (t: any) => t.custom_text_alias
          ) || []
        );
        const fetchedTextAliases = new Set(
          existingTexts.map((t) => t.custom_text_alias)
        );

        // Check if the text lists are different (different lengths or different aliases)
        const isDifferent =
          existingTexts.length !==
            (mappedInitial.knowledgeBaseText?.length || 0) ||
          !Array.from(fetchedTextAliases).every((alias) =>
            currentMappedTextAliases.has(alias)
          );

        if (isDifferent) {
          setMappedInitial((prev: any) => ({
            ...prev,
            knowledgeBaseText: existingTexts,
          }));
        }
      }
    }
  }, [knowledgeBaseText, mappedInitial]);

  // Sync mappedInitial with knowledgeBaseQnA when they are fetched
  // This ensures the "Clear" button preserves existing QnA and prevents false unsaved changes
  useEffect(() => {
    if (mappedInitial && knowledgeBaseQnA.length > 0) {
      // Only update if knowledgeBaseQnA have "existing" status items
      const existingQnA = knowledgeBaseQnA.filter(
        (qna) => qna.status === "existing"
      );

      // Only sync if there are existing QnA and they differ from mappedInitial
      if (existingQnA.length > 0) {
        const currentMappedQnAAliases = new Set(
          mappedInitial.knowledgeBaseQnA?.map((q: any) => q.qna_alias) || []
        );
        const fetchedQnAAliases = new Set(existingQnA.map((q) => q.qna_alias));

        // Check if the QnA lists are different
        const isDifferent =
          existingQnA.length !==
            (mappedInitial.knowledgeBaseQnA?.length || 0) ||
          !Array.from(fetchedQnAAliases).every((alias) =>
            currentMappedQnAAliases.has(alias)
          );

        if (isDifferent) {
          setMappedInitial((prev: any) => ({
            ...prev,
            knowledgeBaseQnA: existingQnA,
          }));
        }
      }
    }
  }, [knowledgeBaseQnA, mappedInitial]);

  const dispatch = useAppDispatch();
  const triggerGetAgentDetails = useAppSelector(
    (state) => state.agent.triggerGetAgentDetails
  );
  const currentAgentDetails = useCurrentAgentDetails();

  // Handle tab change and update URL
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set("activeTab", newTab);
    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${window.location.pathname}${query}`);
  };

  const buildUpdatePayload = (
    mappedInitial: any,
    current: any,
    initialAgentDetails: any
  ) => {
    const payload: any = {
      agent_id:
        current?.agentID ||
        mappedInitial?.agentID ||
        initialAgentDetails?.agent_id ||
        initialAgentDetails?.agentID,
    };

    // Check each field for changes and add to payload if different
    if (!isEquivalent(mappedInitial.agentName, current.agentName)) {
      payload.agent_name = current.agentName;
    }

    if (!isEquivalent(mappedInitial.baseURL, current.baseURL)) {
      payload.base_url = current.baseURL;
    }

    if (!isEquivalent(mappedInitial.systemPrompt, current.systemPrompt)) {
      payload.system_prompt = current.systemPrompt;
    }

    if (!isEquivalent(mappedInitial.welcomeMessage, current.welcomeMessage)) {
      payload.welcome_message = current.welcomeMessage;
    }

    if (!isEquivalent(mappedInitial.llmModel, current.llmModel)) {
      payload.llm_model = current.llmModel;
    }

    if (mappedInitial.temperature !== current.temperature) {
      payload.temperature = current.temperature;
    }

    // Compare arrays for links - check if there are new links to add
    const newLinksToAdd =
      current.knowledgeBaseLinks
        ?.filter((link: any) => link.checked && link.status === "new")
        ?.map((link: any) => link.link) || [];

    if (newLinksToAdd.length > 0) {
      payload.links = newLinksToAdd;
    }

    // Compare arrays for files
    if (
      JSON.stringify(mappedInitial.knowledgeBaseFiles) !==
      JSON.stringify(current.knowledgeBaseFiles)
    ) {
      payload.files =
        current.knowledgeBaseFiles
          ?.filter((file: any) => file.checked)
          ?.map((file: any) => ({
            file_name: file.name,
            file_key: file.s3_key,
            cdn_url: file.cdn_url,
            file_source: "local",
          })) || [];
    }

    // Compare arrays for custom texts
    if (
      JSON.stringify(mappedInitial.knowledgeBaseText) !==
      JSON.stringify(current.knowledgeBaseText)
    ) {
      payload.custom_texts =
        current.knowledgeBaseText?.map((text: any) => ({
          custom_text_alias: text.custom_text_alias,
          custom_text: text.custom_text,
        })) || [];
    }

    // Compare arrays for QnA pairs
    if (
      JSON.stringify(mappedInitial.knowledgeBaseQnA) !==
      JSON.stringify(current.knowledgeBaseQnA)
    ) {
      payload.qa_pairs =
        current.knowledgeBaseQnA?.map((qna: any) => ({
          qna_alias: qna.qna_alias,
          question: qna.question,
          answer: qna.answer,
        })) || [];
    }

    return payload;
  };

  const handleUpdate = async () => {
    try {
      const current = currentAgentDetails;

      if (!mappedInitial || !current) {
        toast.error("Unable to save: Missing agent details");
        return;
      }

      const token = Cookies.get("elysium_atlas_session_token");

      // Build initial payload
      let payload = buildUpdatePayload(
        mappedInitial,
        current,
        initialAgentDetails
      );

      // Keep track of newly uploaded files to remove after successful save
      // This needs to be done *before* their status is changed to "existing" in Redux
      const newFilesToRemove =
        current.knowledgeBaseFiles
          ?.filter((file: any) => file.checked && file.status === "new")
          ?.map((file: any) => file.name) || [];

      // Handle file uploads if there are new files
      if (documentFiles.length > 0 && agentID) {
        // Generate presigned URLs for new files
        const filesPayload = documentFiles.map((file) => ({
          folder_path: `/agents/${agentID}/knowledgebase_files`,
          filename: file.name,
          filetype: file.type,
          visibility: "private",
        }));

        try {
          const presignedResponse = await fastApiAxios.post(
            "/elysium-agents/elysium-atlas/agent/v1/generate-presigned-urls",
            { files: filesPayload },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!presignedResponse.data.success) {
            toast.error(
              presignedResponse.data.message ||
                "Failed to generate presigned URLs"
            );
            return;
          }

          // Upload files to presigned URLs
          const uploadPromises =
            presignedResponse.data.presigned_urls.files.map(
              async (urlObj: {
                filename: string;
                upload_url: string;
                s3_key: string;
                cdn_url?: string;
              }) => {
                const file = documentFiles.find(
                  (df) => df.name === urlObj.filename
                );
                if (file) {
                  await axios.put(urlObj.upload_url, file, {
                    headers: {
                      "Content-Type": file.type,
                    },
                  });
                }
              }
            );

          await Promise.all(uploadPromises);

          // Update knowledgeBaseFiles with s3_key and cdn_url
          const updatedFiles = knowledgeBaseFiles.map((file) => {
            const presignedFile =
              presignedResponse.data.presigned_urls.files.find(
                (f: any) => f.filename === file.name
              );
            if (presignedFile) {
              return {
                ...file,
                s3_key: presignedFile.s3_key,
                cdn_url: presignedFile.cdn_url || null,
                status: "existing", // Mark as existing after upload
              };
            }
            return file;
          });
          dispatch(setKnowledgeBaseFiles(updatedFiles));

          // Update payload with uploaded file data (including s3_key from presigned API)
          payload.files =
            updatedFiles
              ?.filter((file: any) => file.checked)
              ?.map((file: any) => ({
                file_name: file.name,
                file_key: file.s3_key,
                cdn_url: file.cdn_url,
                file_source: "local",
              })) || [];

          // Clear documentFiles after successful upload
          setDocumentFiles([]);
        } catch (error: any) {
          const uploadErrorMessage =
            error.response?.data?.message ||
            error.message ||
            "Failed to upload files. Please try again.";
          toast.error(uploadErrorMessage);
          return;
        }
      }

      // Keep track of new links to remove after successful save
      const newLinksToRemove =
        current.knowledgeBaseLinks
          ?.filter((link: any) => link.checked && link.status === "new")
          ?.map((link: any) => link.link) || [];

      // Keep track of new custom texts to remove after successful save
      const newTextsToRemove =
        current.knowledgeBaseText
          ?.filter((text: any) => text.status === "new")
          ?.map((text: any) => text.custom_text_alias) || [];

      // Add new custom texts to payload if any exist
      const newCustomTexts =
        current.knowledgeBaseText?.filter(
          (text: any) => text.status === "new"
        ) || [];

      if (newCustomTexts.length > 0) {
        payload.custom_texts = newCustomTexts.map((text: any) => ({
          custom_text_alias: text.custom_text_alias,
          custom_text: text.custom_text,
        }));
      }

      console.log("Update payload:", payload);

      // Make API call
      const response = await fastApiAxios.post(
        "/elysium-agents/elysium-atlas/agent/v1/update-agent",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Agent updated successfully");

        // Remove new links from Redux after successful save
        if (newLinksToRemove.length > 0) {
          const updatedLinks = current.knowledgeBaseLinks.filter(
            (link: any) => !newLinksToRemove.includes(link.link)
          );
          dispatch(setKnowledgeBaseLinks(updatedLinks));
        }

        // Remove newly uploaded files from Redux after successful save
        if (newFilesToRemove.length > 0) {
          const updatedFiles = current.knowledgeBaseFiles.filter(
            (file: any) => !newFilesToRemove.includes(file.name)
          );
          dispatch(setKnowledgeBaseFiles(updatedFiles));
        }

        // Remove newly added custom texts from Redux after successful save
        if (newTextsToRemove.length > 0) {
          const updatedTexts = current.knowledgeBaseText.filter(
            (text: any) => !newTextsToRemove.includes(text.custom_text_alias)
          );
          dispatch(setKnowledgeBaseText(updatedTexts));
        }

        // Remove newly added QnA from Redux after successful save
        const newQnAToRemove =
          current.knowledgeBaseQnA
            ?.filter((qna: any) => qna.status === "new")
            ?.map((qna: any) => qna.qna_alias) || [];

        if (newQnAToRemove.length > 0) {
          const updatedQnA = current.knowledgeBaseQnA.filter(
            (qna: any) => !newQnAToRemove.includes(qna.qna_alias)
          );
          dispatch(setKnowledgeBaseQnA(updatedQnA));
        }

        dispatch(setTriggerGetAgentDetails(triggerGetAgentDetails + 1));
      } else {
        toast.error(
          "Failed to update agent: " +
            (response.data.message || "Unknown error")
        );
      }
    } catch (error: any) {
      console.error("Update error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update agent";
      toast.error(errorMessage);
    }
  };

  const handleClear = () => {
    console.log("[handleClear] initialAgentDetails:", initialAgentDetails);
    if (!initialAgentDetails) {
      console.warn("[handleClear] No initial agent details to clear to");
      return;
    }

    // Check if initialAgentDetails is already mapped (has camelCase properties)
    // or if it needs mapping (has snake_case properties)
    const isAlreadyMapped =
      "agentName" in initialAgentDetails || "baseURL" in initialAgentDetails;
    const dataToUse = isAlreadyMapped ? initialAgentDetails : mappedInitial;

    console.log("[handleClear] isAlreadyMapped:", isAlreadyMapped);
    console.log("[handleClear] dataToUse:", dataToUse);

    if (!dataToUse) {
      console.warn("[handleClear] No data to clear to");
      return;
    }

    // Reset all fields to initial values
    if (dataToUse.agentName !== undefined)
      dispatch(setAgentName(dataToUse.agentName || ""));
    if (dataToUse.baseURL !== undefined)
      dispatch(setBaseURL(dataToUse.baseURL || ""));
    if (dataToUse.agent_status !== undefined)
      dispatch(setAgentStatus(dataToUse.agent_status || ""));
    if (dataToUse.agent_current_task !== undefined)
      dispatch(setAgentCurrentTask(dataToUse.agent_current_task || ""));
    if (dataToUse.progress !== undefined)
      dispatch(setProgress(dataToUse.progress || 0));
    if (dataToUse.systemPrompt !== undefined)
      dispatch(setSystemPrompt(dataToUse.systemPrompt || ""));
    if (dataToUse.temperature !== undefined)
      dispatch(setTemperature(dataToUse.temperature || 0));
    if (dataToUse.welcomeMessage !== undefined)
      dispatch(setWelcomeMessage(dataToUse.welcomeMessage || ""));
    if (dataToUse.llmModel !== undefined)
      dispatch(setLlmModel(dataToUse.llmModel || ""));

    // Reset knowledge base data - filter out new items, keep only existing
    if (knowledgeBaseLinks !== undefined) {
      const existingLinks = knowledgeBaseLinks.filter(
        (link) => link.status === "existing"
      );
      dispatch(setKnowledgeBaseLinks(existingLinks));
    }

    if (knowledgeBaseFiles !== undefined) {
      const existingFiles = knowledgeBaseFiles.filter(
        (file) => file.status === "existing"
      );
      dispatch(setKnowledgeBaseFiles(existingFiles));

      // Also update local documentFiles to remove files that were filtered out
      // The reverse sync in AgentFiles will handle this, but we can clear new files explicitly
      setDocumentFiles((prevFiles) => {
        const existingFileNames = new Set(existingFiles.map((f) => f.name));
        return prevFiles.filter((file) => existingFileNames.has(file.name));
      });
    }

    if (knowledgeBaseText !== undefined) {
      const existingTexts = knowledgeBaseText.filter(
        (text) => text.status === "existing"
      );
      dispatch(setKnowledgeBaseText(existingTexts));
    }

    // For knowledgeBaseQnA, we want to clear ONLY the new entries
    // but keep the existing ones that were fetched from the API
    if (knowledgeBaseQnA.length > 0) {
      const existingQnA = knowledgeBaseQnA.filter(
        (qna) => qna.status === "existing"
      );
      dispatch(setKnowledgeBaseQnA(existingQnA));

      // Also ensure documentFiles locally is synced if needed
    } else if (dataToUse.knowledgeBaseQnA !== undefined) {
      dispatch(setKnowledgeBaseQnA(dataToUse.knowledgeBaseQnA || []));
    }
  };

  useEffect(() => {
    console.log("[MyAgent] initialAgentDetails:", initialAgentDetails);
    console.log("[MyAgent] currentAgentDetails:", currentAgentDetails);
  }, [initialAgentDetails, currentAgentDetails]);

  // Set default activeTab in URL if not present
  useEffect(() => {
    if (!searchParams.get("activeTab")) {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      current.set("activeTab", "agent");
      const search = current.toString();
      const query = search ? `?${search}` : "";
      router.push(`${window.location.pathname}${query}`);
    }
  }, [searchParams, router]);

  const handlePreview = () => {
    // Reset chat state before opening preview
    dispatch(resetAgentChat());

    const chatSessionId = "app-" + uuidv4();
    const url = `/chat-with-agent?agent_id=${agentID}&chat_session_id=${chatSessionId}`;
    window.open(url, "_blank");
  };

  return (
    <>
      <div className="sticky top-[65px] z-50">
        <div className="w-full flex flex-row items-center justify-between bg-white dark:bg-[#0a0a0a]">
          <div className="flex  flex-row items-center justify-center w-[85%]">
            <CustomTabs value={activeTab} onValueChange={handleTabChange}>
              <AgentBuilderTabs
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </CustomTabs>
          </div>
          <div className="flex items-center justify-end">
            <PrimaryButton className="text-[13px]" onClick={handlePreview}>
              <div className="flex items-center justify-center gap-[6px]">
                <SquareArrowOutUpRight size={16} />{" "}
                <p className="lg:block md:hidden hidden">Preview Agent</p>
              </div>
            </PrimaryButton>
          </div>
        </div>
      </div>
      {activeTab === "agent" && (
        <AgentMainContent
          initialAgentDetails={mappedInitial}
          onSave={handleUpdate}
        />
      )}
      {activeTab === "links" && (
        <div className="mt-6">
          <AgentLinks />
        </div>
      )}
      {activeTab === "files" && (
        <div className="mt-6">
          <AgentFiles
            documentFiles={documentFiles}
            setDocumentFiles={setDocumentFiles}
          />
        </div>
      )}
      {activeTab === "text" && (
        <div className="mt-6">
          <AgentText />
        </div>
      )}
      {activeTab === "qna" && (
        <div className="mt-6">
          <AgentQnA />
        </div>
      )}
      {mappedInitial && (
        <UnsavedChangesBar
          initial={mappedInitial}
          current={currentAgentDetails}
          onSave={handleUpdate}
          onClear={handleClear}
        />
      )}
    </>
  );
}
