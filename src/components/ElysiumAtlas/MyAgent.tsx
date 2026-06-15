import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import Cookies from "js-cookie";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CustomTabs } from "@/components/ui/CustomTabs";
import AgentDataSource, { AgentDataSourceTabs } from "./AgentDataSource";
import AgentPersonalize from "./AgentPersonalize";
import AgentLiveVisitors from "./AgentLiveVisitors";
import AgentBackButton from "./AgentBackButton";
import AgentMainContent from "./AgentMainContent";
import UnsavedChangesBar from "./UnsavedChangesBar";
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
  setRetrievalStrategy,
  setToolIds,
  setKnowledgeBaseLinks,
  setKnowledgeBaseFiles,
  setKnowledgeBaseText,
  setKnowledgeBaseQnA,
  setTriggerGetAgentDetails,
  setTriggerFetchAgentUrls,
  setTriggerFetchAgentFiles,
  setTriggerFetchAgentCustomTexts,
  setTriggerFetchAgentQnA,
  setAgentIcon,
  setPrimaryColor,
  setSecondaryColor,
  setTextColor,
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
import { triggerFetchAgents } from "@/store/reducers/userAgentsSlice";
import { SquareArrowOutUpRight } from "lucide-react";
import axios from "axios";
import { useAgentReadOnly } from "@/hooks/useCanManageAgents";
import {
  getSectionLabel,
  isNoTabSection,
  resolveSection,
  resolveActiveTab,
} from "@/utils/agentSectionUtils";

export default function MyAgent({
  initialAgentDetails,
}: {
  initialAgentDetails: any;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const agentID = useAppSelector((state) => state.agent.agentID);
  const section = resolveSection(searchParams);
  const urlActiveTab = resolveActiveTab(searchParams, section);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const activeTab = pendingTab ?? urlActiveTab;

  useEffect(() => {
    if (pendingTab !== null && pendingTab === urlActiveTab) {
      setPendingTab(null);
    }
  }, [pendingTab, urlActiveTab]);

  const [mappedInitial, setMappedInitial] = useState<any>(null);

  /* State lifted from AgentFiles to persist across tab switches */
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);

  /* Avatar file lifted from AgentAvatarImageTab */
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  /* Signal to tell AgentAvatarRight to re-seed from Redux on clear */
  const [avatarClearSignal, setAvatarClearSignal] = useState(0);

  const knowledgeBaseLinks = useAppSelector(
    (state) => state.agent.knowledgeBaseLinks,
  );

  const knowledgeBaseFiles = useAppSelector(
    (state) => state.agent.knowledgeBaseFiles,
  );

  const knowledgeBaseText = useAppSelector(
    (state) => state.agent.knowledgeBaseText,
  );

  const knowledgeBaseQnA = useAppSelector(
    (state) => state.agent.knowledgeBaseQnA,
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
        (link) => link.status === "existing",
      );

      // Only sync if there are existing links and they differ from mappedInitial
      if (existingLinks.length > 0) {
        const currentMappedLinkUrls = new Set(
          mappedInitial.knowledgeBaseLinks.map((l: any) => l.link),
        );
        const fetchedLinkUrls = new Set(existingLinks.map((l) => l.link));

        // Check if the link lists are different (different lengths or different URLs)
        const isDifferent =
          existingLinks.length !== mappedInitial.knowledgeBaseLinks.length ||
          !Array.from(fetchedLinkUrls).every((url) =>
            currentMappedLinkUrls.has(url),
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
      // Only update if knowledgeBaseFiles have API-fetched items
      // (status !== "new" covers "indexed", "indexing", "failed", etc.)
      const existingFiles = knowledgeBaseFiles.filter(
        (file) => file.status !== "new",
      );

      // Only sync if there are existing files and they differ from mappedInitial
      if (existingFiles.length > 0) {
        const currentMappedFileNames = new Set(
          mappedInitial.knowledgeBaseFiles.map((f: any) => f.name),
        );
        const fetchedFileNames = new Set(existingFiles.map((f) => f.name));

        // Check if the file lists are different (different lengths or different names)
        const isDifferent =
          existingFiles.length !== mappedInitial.knowledgeBaseFiles.length ||
          !Array.from(fetchedFileNames).every((name) =>
            currentMappedFileNames.has(name),
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
      // Only update if knowledgeBaseText have API-fetched items
      // (status !== "new" covers "indexed", "indexing", "failed", etc.)
      const existingTexts = knowledgeBaseText.filter(
        (text) => text.status !== "new",
      );

      // Only sync if there are existing texts and they differ from mappedInitial
      if (existingTexts.length > 0) {
        const currentMappedTextAliases = new Set(
          mappedInitial.knowledgeBaseText?.map(
            (t: any) => t.custom_text_alias,
          ) || [],
        );
        const fetchedTextAliases = new Set(
          existingTexts.map((t) => t.custom_text_alias),
        );

        // Check if the text lists are different (different lengths or different aliases)
        const isDifferent =
          existingTexts.length !==
            (mappedInitial.knowledgeBaseText?.length || 0) ||
          !Array.from(fetchedTextAliases).every((alias) =>
            currentMappedTextAliases.has(alias),
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
      // Only update if knowledgeBaseQnA have API-fetched items
      // (status !== "new" covers "indexed", "indexing", "active", etc.)
      const existingQnA = knowledgeBaseQnA.filter(
        (qna) => qna.status !== "new",
      );

      // Only sync if there are existing QnA and they differ from mappedInitial
      if (existingQnA.length > 0) {
        const currentMappedQnAAliases = new Set(
          mappedInitial.knowledgeBaseQnA?.map((q: any) => q.qna_alias) || [],
        );
        const fetchedQnAAliases = new Set(existingQnA.map((q) => q.qna_alias));

        // Check if the QnA lists are different
        const isDifferent =
          existingQnA.length !==
            (mappedInitial.knowledgeBaseQnA?.length || 0) ||
          !Array.from(fetchedQnAAliases).every((alias) =>
            currentMappedQnAAliases.has(alias),
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
    (state) => state.agent.triggerGetAgentDetails,
  );
  const triggerFetchAgentUrls = useAppSelector(
    (state) => state.agent.triggerFetchAgentUrls,
  );
  const triggerFetchAgentFiles = useAppSelector(
    (state) => state.agent.triggerFetchAgentFiles,
  );
  const triggerFetchAgentCustomTexts = useAppSelector(
    (state) => state.agent.triggerFetchAgentCustomTexts,
  );
  const triggerFetchAgentQnA = useAppSelector(
    (state) => state.agent.triggerFetchAgentQnA,
  );
  const currentAgentDetails = useCurrentAgentDetails();
  const readOnly = useAgentReadOnly();

  const handleTabChange = useCallback(
    (newTab: string) => {
      if (newTab === activeTab) return;

      setPendingTab(newTab);

      const params = new URLSearchParams(searchParams.toString());
      params.set("section", "data-source");
      params.set("activeTab", newTab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [activeTab, pathname, router, searchParams],
  );

  const buildUpdatePayload = (
    mappedInitial: any,
    current: any,
    initialAgentDetails: any,
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

    if (!isEquivalent(mappedInitial.agent_status, current.agent_status)) {
      payload.agent_status = current.agent_status;
    }

    if (!isEquivalent(mappedInitial.systemPrompt, current.systemPrompt)) {
      payload.system_prompt = current.systemPrompt;
    }

    if (!isEquivalent(mappedInitial.welcomeMessage, current.welcomeMessage)) {
      payload.welcome_message = current.welcomeMessage;
    }

    if (
      !isEquivalent(
        mappedInitial.agent_icon ?? null,
        current.agent_icon ?? null,
      )
    ) {
      // Only send agent_icon for URL values (link tab).
      // data: URLs from the image tab require an S3 upload first — handled separately.
      const newIcon = current.agent_icon ?? null;
      if (!newIcon || !newIcon.startsWith("data:")) {
        payload.agent_icon = newIcon;
      }
    }

    if (!isEquivalent(mappedInitial.primary_color, current.primary_color)) {
      payload.primary_color = current.primary_color;
    }

    if (!isEquivalent(mappedInitial.secondary_color, current.secondary_color)) {
      payload.secondary_color = current.secondary_color;
    }

    if (!isEquivalent(mappedInitial.text_color, current.text_color)) {
      payload.text_color = current.text_color;
    }

    if (!isEquivalent(mappedInitial.llmModel, current.llmModel)) {
      payload.llm_model = current.llmModel;
    }

    if (
      !isEquivalent(mappedInitial.retrievalStrategy, current.retrievalStrategy)
    ) {
      payload.retrieval_strategy = current.retrievalStrategy;
    }

    const initialToolIds = [...(mappedInitial.toolIds ?? [])].sort().join(",");
    const currentToolIds = [...(current.toolIds ?? [])].sort().join(",");
    if (initialToolIds !== currentToolIds) {
      payload.tool_ids = current.toolIds ?? [];
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

    // Only send custom texts that are new (not yet saved to the server)
    const newCustomTextItems =
      current.knowledgeBaseText?.filter((text: any) => text.status === "new") ||
      [];

    if (newCustomTextItems.length > 0) {
      payload.custom_texts = newCustomTextItems.map((text: any) => ({
        custom_text_alias: text.custom_text_alias,
        custom_text: text.custom_text,
      }));
    }

    // Only send QnA pairs that are new (not yet saved to the server)
    const newQnAPairs =
      current.knowledgeBaseQnA?.filter((qna: any) => qna.status === "new") ||
      [];

    if (newQnAPairs.length > 0) {
      payload.qa_pairs = newQnAPairs.map((qna: any) => ({
        qna_alias: qna.qna_alias,
        question: qna.question,
        answer: qna.answer,
      }));
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
        initialAgentDetails,
      );

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
            },
          );

          if (!presignedResponse.data.success) {
            toast.error(
              presignedResponse.data.message ||
                "Failed to generate presigned URLs",
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
                  (df) => df.name === urlObj.filename,
                );
                if (file) {
                  await axios.put(urlObj.upload_url, file, {
                    headers: {
                      "Content-Type": file.type,
                    },
                  });
                }
              },
            );

          await Promise.all(uploadPromises);

          // Update knowledgeBaseFiles with s3_key and cdn_url
          const updatedFiles = knowledgeBaseFiles.map((file) => {
            const presignedFile =
              presignedResponse.data.presigned_urls.files.find(
                (f: any) => f.filename === file.name,
              );
            if (presignedFile) {
              return {
                ...file,
                s3_key: presignedFile.s3_key,
                cdn_url: presignedFile.cdn_url || null,
                status: "indexing", // Mark as indexing after upload (will be updated by polling)
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

      // Handle avatar image upload if a file was dropped in the image tab
      if (avatarFile && agentID) {
        try {
          const avatarPresignedResponse = await fastApiAxios.post(
            "/elysium-agents/elysium-atlas/agent/v1/generate-presigned-urls",
            {
              files: [
                {
                  folder_path: `/agent_avatars/${agentID}`,
                  filename: avatarFile.name,
                  filetype: avatarFile.type,
                  file_source: "local",
                  visibility: "public",
                },
              ],
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (!avatarPresignedResponse.data.success) {
            toast.error(
              avatarPresignedResponse.data.message ||
                "Failed to generate presigned URL for avatar",
            );
            return;
          }

          const avatarUrlObj =
            avatarPresignedResponse.data.presigned_urls.files[0];

          // Upload the avatar file to S3
          await axios.put(avatarUrlObj.upload_url, avatarFile, {
            headers: {
              "Content-Type": avatarFile.type,
            },
          });

          // Store the CDN URL in Redux and include in payload
          const avatarCdnUrl = avatarUrlObj.cdn_url;
          dispatch(setAgentIcon(avatarCdnUrl));
          payload.agent_icon = avatarCdnUrl;

          // Clear the avatarFile since it's been uploaded
          setAvatarFile(null);
        } catch (error: any) {
          const avatarErrorMessage =
            error.response?.data?.message ||
            error.message ||
            "Failed to upload avatar image. Please try again.";
          toast.error(avatarErrorMessage);
          return;
        }
      }

      // Keep track of new links to remove after successful save
      const newLinksToRemove =
        current.knowledgeBaseLinks
          ?.filter((link: any) => link.checked && link.status === "new")
          ?.map((link: any) => link.link) || [];

      // Add new custom texts to payload if any exist
      const newCustomTexts =
        current.knowledgeBaseText?.filter(
          (text: any) => text.status === "new",
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
        },
      );

      if (response.data.success) {
        toast.success(response.data.message || "Agent updated successfully");
        dispatch(setTriggerFetchAgentUrls(triggerFetchAgentUrls + 1));
        dispatch(setTriggerFetchAgentFiles(triggerFetchAgentFiles + 1));
        dispatch(
          setTriggerFetchAgentCustomTexts(triggerFetchAgentCustomTexts + 1),
        );
        dispatch(setTriggerFetchAgentQnA(triggerFetchAgentQnA + 1));

        // Remove new links from Redux after successful save
        if (newLinksToRemove.length > 0) {
          const updatedLinks = current.knowledgeBaseLinks.filter(
            (link: any) => !newLinksToRemove.includes(link.link),
          );
          dispatch(setKnowledgeBaseLinks(updatedLinks));
        }

        // Note: newly uploaded files are NOT removed from Redux here.
        // Their status was already updated to "indexing" after S3 upload,
        // so they are excluded from unsaved-changes comparison.
        // The triggerFetchAgentFiles re-fetch above will replace them with
        // fresh API data (with the correct server-side status) once it completes.

        // Mark newly added custom texts as "indexing" after successful save.
        // The triggerFetchAgentCustomTexts polling will replace them with real server status.
        const newTextItems =
          current.knowledgeBaseText?.filter(
            (text: any) => text.status === "new",
          ) || [];

        if (newTextItems.length > 0) {
          const updatedTexts = current.knowledgeBaseText.map((text: any) =>
            text.status === "new" ? { ...text, status: "indexing" } : text,
          );
          dispatch(setKnowledgeBaseText(updatedTexts));
        }

        // Mark newly added QnA as "indexing" after successful save.
        // They stay visible with the indexing pill, and the triggerFetchAgentQnA
        // polling will replace them with the real server status once processed.
        const newQnAItems =
          current.knowledgeBaseQnA?.filter(
            (qna: any) => qna.status === "new",
          ) || [];

        if (newQnAItems.length > 0) {
          const updatedQnA = current.knowledgeBaseQnA.map((qna: any) =>
            qna.status === "new" ? { ...qna, status: "indexing" } : qna,
          );
          dispatch(setKnowledgeBaseQnA(updatedQnA));
        }

        dispatch(setTriggerGetAgentDetails(triggerGetAgentDetails + 1));

        if (payload.agent_status !== undefined) {
          dispatch(triggerFetchAgents());
        }
      } else {
        toast.error(
          "Failed to update agent: " +
            (response.data.message || "Unknown error"),
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
    if (dataToUse.retrievalStrategy !== undefined)
      dispatch(setRetrievalStrategy(dataToUse.retrievalStrategy || "simple"));
    dispatch(setToolIds(dataToUse.toolIds ?? []));
    dispatch(setAgentIcon(dataToUse.agent_icon ?? null));
    dispatch(setPrimaryColor(dataToUse.primary_color || "#fff"));
    dispatch(setSecondaryColor(dataToUse.secondary_color || "#fff"));
    dispatch(setTextColor(dataToUse.text_color || "#111"));
    setAvatarFile(null);
    setAvatarClearSignal((prev) => prev + 1);

    // Reset knowledge base data - filter out new items, keep only existing
    if (knowledgeBaseLinks !== undefined) {
      const existingLinks = knowledgeBaseLinks.filter(
        (link) => link.status === "existing",
      );
      dispatch(setKnowledgeBaseLinks(existingLinks));
    }

    if (knowledgeBaseFiles !== undefined) {
      const existingFiles = knowledgeBaseFiles.filter(
        (file) => file.status !== "new",
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
        (text) => text.status !== "new",
      );
      dispatch(setKnowledgeBaseText(existingTexts));
    }

    // For knowledgeBaseQnA, clear ONLY new entries, keep all API-fetched ones
    if (knowledgeBaseQnA.length > 0) {
      const existingQnA = knowledgeBaseQnA.filter(
        (qna) => qna.status !== "new",
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

  // Normalize invalid or legacy URL params without fighting in-flight tab changes
  useEffect(() => {
    const resolvedSection = resolveSection(searchParams);
    const urlSection = searchParams.get("section");
    const urlTab = searchParams.get("activeTab");

    if (isNoTabSection(resolvedSection)) {
      if (resolvedSection !== urlSection || urlTab) {
        router.replace(`${pathname}?section=${resolvedSection}`, {
          scroll: false,
        });
      }
      return;
    }

    const resolvedTab = resolveActiveTab(searchParams, resolvedSection);

    if (urlSection !== resolvedSection || urlTab !== resolvedTab) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("section", resolvedSection);
      params.set("activeTab", resolvedTab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  const handleBack = () => {
    router.push("/my-agents");
  };

  const handlePreview = () => {
    // Reset chat state before opening preview
    dispatch(resetAgentChat());

    // Check if a preview chat session ID already exists in localStorage
    let chatSessionId = localStorage.getItem("preview_chat_session_id");

    if (!chatSessionId) {
      // Create a new chat session ID and store it in localStorage
      chatSessionId = "app-" + uuidv4();
      localStorage.setItem("preview_chat_session_id", chatSessionId);
    }

    const url = `/chat-with-agent?agent_id=${agentID}&chat_session_id=${chatSessionId}`;
    window.open(url, "_blank");
  };

  return (
    <>
      <div className="sticky top-[65px] z-50 bg-white dark:bg-[#0a0a0a]">
        <div className="w-full flex flex-row items-center justify-between gap-[8px]">
          <div className="flex flex-row items-center gap-5 min-w-0">
            <div className="mt-[10px] shrink-0">
              <AgentBackButton onBack={handleBack} />
            </div>
            <h1 className="mt-[10px] text-[26px] font-semibold text-gray-900 dark:text-gray-100 truncate">
              {getSectionLabel(section)}
            </h1>
          </div>
          {section === "general" && (
            <div className="flex items-center justify-end shrink-0">
              <PrimaryButton className="text-[13px]" onClick={handlePreview}>
                <div className="flex items-center justify-center gap-[6px]">
                  <SquareArrowOutUpRight size={16} />{" "}
                  <p className="lg:block md:hidden hidden">Preview Agent</p>
                </div>
              </PrimaryButton>
            </div>
          )}
        </div>
        {section === "data-source" && (
          <CustomTabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full mt-2"
          >
            <AgentDataSourceTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          </CustomTabs>
        )}
      </div>
      {section === "general" && (
        <AgentMainContent
          initialAgentDetails={mappedInitial}
          onSave={handleUpdate}
        />
      )}
      {section === "data-source" && (
        <AgentDataSource
          activeTab={activeTab}
          documentFiles={documentFiles}
          setDocumentFiles={setDocumentFiles}
        />
      )}
      {section === "personalize" && (
        <AgentPersonalize
          avatarFile={avatarFile}
          setAvatarFile={setAvatarFile}
          clearSignal={avatarClearSignal}
        />
      )}
      {section === "live-visitors" && <AgentLiveVisitors />}
      {mappedInitial && !readOnly && (
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
