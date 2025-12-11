"use client";
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import {
  setBaseURL,
  setKnowledgeBaseLinks,
} from "@/store/reducers/agentBuilderSlice";
import CustomInput from "@/components/inputs/CustomInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Spinner from "@/components/ui/Spinner";
import AddSitemapDialog from "./AddSitemapDialog";
import KnowledgeBaseLinksList from "./KnowledgeBaseLinksList";
import { toast } from "sonner";
import fastApiAxios from "@/utils/fastapi_axios";
import Cookies from "js-cookie";
import { cleanAndDeduplicateLinks } from "@/utils/linkUtils";

export default function KnowledgeBaseLinks() {
  const dispatch = useDispatch();
  const baseURL = useSelector((state: RootState) => state.agentBuilder.baseURL);
  const knowledgeBaseLinks = useSelector(
    (state: RootState) => state.agentBuilder.knowledgeBaseLinks
  );
  const [isLoading, setIsLoading] = useState(false);

  const validateURL = (url: string): boolean => {
    if (!url || url.trim() === "") {
      return false;
    }
    return url.trim().length > 0;
  };

  const handleExtractLinks = async () => {
    // Basic validation
    if (!validateURL(baseURL)) {
      toast.error("Please enter a valid URL");
      return;
    }

    setIsLoading(true);
    const token = Cookies.get("elysium_atlas_session_token");

    try {
      const response = await fastApiAxios.post(
        "/elysium-agents/elysium-atlas/v1/extract-url-links",
        {
          source: "url",
          link: baseURL,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success === true) {
        const responseLinks = response.data.links || [];

        // Clean and deduplicate links from response
        const cleanedLinks = cleanAndDeduplicateLinks(responseLinks);

        // Filter out links that already exist in Redux
        const existingLinksSet = new Set(knowledgeBaseLinks);
        const uniqueNewLinks = cleanedLinks.filter(
          (link) => !existingLinksSet.has(link)
        );

        if (uniqueNewLinks.length > 0) {
          // Append unique links to existing ones
          dispatch(
            setKnowledgeBaseLinks([...knowledgeBaseLinks, ...uniqueNewLinks])
          );
          toast.success(
            response.data.message ||
              `Successfully extracted ${uniqueNewLinks.length} new unique links from URL`
          );
        } else {
          toast.info(
            "All extracted links are already in the list or were filtered out"
          );
        }
      } else {
        toast.error(
          response.data.message || "Failed to extract links from URL"
        );
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to extract links from URL. Please check the URL and try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="w-full flex items-center justify-end">
        <div className="flex justify-end mt-[4px]">
          <AddSitemapDialog />
        </div>
      </div>
      <div className="lg:text-[14px] text-[12px] font-bold mt-4">
        Base Website Link
      </div>
      <div className="flex items-center gap-3 mt-[4px]">
        <CustomInput
          type="url"
          placeholder="Enter base website URL (e.g., https://example.com)"
          value={baseURL}
          onChange={(e) => dispatch(setBaseURL(e.target.value))}
          className="flex-1 px-[12px] py-[10px]"
        />
        <PrimaryButton
          className="text-[12px] font-semibold flex items-center justify-center gap-2 min-w-[110px] min-h-[41px] shrink-0"
          onClick={handleExtractLinks}
          disabled={isLoading}
        >
          {isLoading ? (
            <Spinner className="border-white dark:border-deep-onyx" />
          ) : (
            <span>Extract Links</span>
          )}
        </PrimaryButton>
      </div>
      <div className="mt-[2px]">
        <KnowledgeBaseLinksList />
      </div>
    </div>
  );
}
