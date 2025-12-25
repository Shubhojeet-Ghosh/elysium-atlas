"use client";
import { useState } from "react";
import { Globe, FileText, Type, MessagesSquare } from "lucide-react";
import {
  CustomTabs,
  CustomTabsContent,
  CustomTabsList,
  CustomTabsTrigger,
} from "@/components/ui/CustomTabs";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { resetAgentBuilder } from "@/store/reducers/agentBuilderSlice";
import KnowledgeBaseLinks from "./KnowledgeBaseLinks";
import KnowledgeBaseFiles from "./KnowledgeBaseFiles";
import KnowledgeBaseText from "./KnowledgeBaseText";
import KnowledgeBaseQnA from "./KnowledgeBaseQnA";
import KnowledgeBaseNavigation from "./KnowledgeBaseNavigation";
import { useRouter } from "next/navigation";
import fastApiAxios from "@/utils/fastapi_axios";
import Cookies from "js-cookie";
import { toast } from "sonner";

interface SetKnowledgeBaseProps {
  documentFiles: File[];
  setDocumentFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

export default function SetKnowledgeBase({
  documentFiles,
  setDocumentFiles,
}: SetKnowledgeBaseProps) {
  const dispatch = useDispatch();
  const router = useRouter();
  const agentName = useSelector(
    (state: RootState) => state.agentBuilder.agentName
  );
  const agentID = useSelector((state: RootState) => state.agentBuilder.agentID);
  const knowledgeBaseLinks = useSelector(
    (state: RootState) => state.agentBuilder.knowledgeBaseLinks
  );
  const knowledgeBaseFiles = useSelector(
    (state: RootState) => state.agentBuilder.knowledgeBaseFiles
  );
  const knowledgeBaseText = useSelector(
    (state: RootState) => state.agentBuilder.knowledgeBaseText
  );
  const knowledgeBaseQnA = useSelector(
    (state: RootState) => state.agentBuilder.knowledgeBaseQnA
  );

  const [activeTab, setActiveTab] = useState("links");
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    setIsLoading(true);
    const token = Cookies.get("elysium_atlas_session_token");

    const checkedLinks = knowledgeBaseLinks
      .filter((link) => link.checked)
      .map((link) => link.link);

    const checkedFiles = knowledgeBaseFiles
      .filter((file) => file.checked)
      .map((file) => ({ file_key: file.name }));

    const customTexts = knowledgeBaseText.map((text) => ({
      custom_text_alias: text.custom_text_alias,
      custom_text: text.custom_text,
    }));

    const qaPairs = knowledgeBaseQnA.map((qna) => ({
      qna_alias: qna.qna_alias,
      question: qna.question,
      answer: qna.answer,
    }));

    const requestBody = {
      agent_id: agentID,
      agent_name: agentName,
      links: checkedLinks,
      files: checkedFiles,
      custom_texts: customTexts,
      qa_pairs: qaPairs,
      agent_aliases: [],
      base_url: "",
      collaborators: [],
      organization_name: "",
      agent_icon: "",
      llm_model: "",
      placeholder_text: "",
      primary_color: "",
      secondary_color: "",
      quick_prompts: [],
      text_color: "",
      welcome_message: "",
      footer: "",
      agent_personality: {},
    };

    try {
      const response = await fastApiAxios.post(
        "/elysium-agents/elysium-atlas/agent/v1/build-update-agent",
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success === true) {
        dispatch(resetAgentBuilder());
        router.push("/my-agents");
      } else {
        toast.error(response.data.message || "Failed to build agent");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to build agent. Please try again.";
      toast.error(errorMessage);
    } finally {
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
    <div className="flex flex-col h-full lg:pb-[40px] pb-[20px]">
      {/* Fixed Header Section */}
      <div className="shrink-0">
        <div className="lg:text-[22px] text-[18px] font-bold flex flex-wrap items-center gap-1 md:gap-2 text-deep-onyx dark:text-pure-mist">
          Add knowledge base
        </div>
        <div className="lg:text-[16px] text-[14px] font-semibold mt-[2px] text-gray-500 dark:text-pure-mist">
          Provide relevant information or documents for your agent's knowledge
        </div>
        <div className="flex flex-col gap-[8px] mt-[14px] md:mt-8 lg:mt-[25px]">
          <div className="lg:text-[14px] text-[12px] font-bold">
            Knowledge Base <span className="text-danger-red ml-[2px]">*</span>
          </div>
        </div>
      </div>

      {/* Tabs with fixed list and scrollable content */}
      <div className="flex flex-col flex-1 min-h-0">
        <CustomTabs
          defaultValue="links"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full flex flex-col flex-1 min-h-0"
        >
          {/* Fixed Tabs List */}
          <div className="shrink-0 mt-[8px]">
            <CustomTabsList className="lg:w-full">
              <CustomTabsTrigger
                value="links"
                className="flex items-center gap-2"
              >
                <Globe size={16} />
                Links
              </CustomTabsTrigger>
              <CustomTabsTrigger
                value="files"
                className="flex items-center gap-2"
              >
                <FileText size={16} />
                Files
              </CustomTabsTrigger>
              <CustomTabsTrigger
                value="text"
                className="flex items-center gap-2"
              >
                <Type size={16} />
                Text
              </CustomTabsTrigger>
              <CustomTabsTrigger
                value="qna"
                className="flex items-center gap-2"
              >
                <MessagesSquare size={16} />
                QnA
              </CustomTabsTrigger>
            </CustomTabsList>
          </div>

          {/* Scrollable Tab Content */}
          <div className="flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <CustomTabsContent value="links">
              <KnowledgeBaseLinks />
            </CustomTabsContent>
            <CustomTabsContent value="files">
              <KnowledgeBaseFiles
                documentFiles={documentFiles}
                setDocumentFiles={setDocumentFiles}
              />
            </CustomTabsContent>
            <CustomTabsContent value="text">
              <KnowledgeBaseText />
            </CustomTabsContent>
            <CustomTabsContent value="qna">
              <KnowledgeBaseQnA />
            </CustomTabsContent>
          </div>
        </CustomTabs>
      </div>

      {/* Fixed Navigation */}
      <div className="shrink-0">
        <KnowledgeBaseNavigation
          onBack={handleBack}
          onContinue={handleContinue}
          disabled={!hasContent}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
