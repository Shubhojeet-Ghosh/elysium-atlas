"use client";
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import {
  setKnowledgeBaseSitemap,
  addKnowledgeBaseLinks,
  setBaseURL,
} from "@/store/reducers/agentBuilderSlice";
import CustomInput from "@/components/inputs/CustomInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Spinner from "@/components/ui/Spinner";
import { Network } from "lucide-react";
import { toast } from "sonner";
import fastApiAxios from "@/utils/fastapi_axios";
import Cookies from "js-cookie";
import { cleanAndDeduplicateLinks } from "@/utils/linkUtils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AddSitemapDialog() {
  const dispatch = useDispatch();
  const knowledgeBaseSitemap = useSelector(
    (state: RootState) => state.agentBuilder.knowledgeBaseSitemap
  );
  const knowledgeBaseLinks = useSelector(
    (state: RootState) => state.agentBuilder.knowledgeBaseLinks
  );
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateSitemapURL = (url: string): boolean => {
    if (!url || url.trim() === "") {
      return false;
    }
    // Basic check: should contain some characters and look like a URL
    const trimmedUrl = url.trim();
    // Check if it has at least a domain-like structure (contains a dot or is a valid path)
    return trimmedUrl.length > 0;
  };

  const handleFetchSitemap = async () => {
    // Basic validation
    if (!validateSitemapURL(knowledgeBaseSitemap)) {
      toast.error("Please enter a valid sitemap URL");
      return;
    }

    setIsLoading(true);
    const token = Cookies.get("elysium_atlas_session_token");

    try {
      const response = await fastApiAxios.post(
        "/elysium-agents/elysium-atlas/v1/extract-url-links",
        {
          source: "sitemap",
          link: knowledgeBaseSitemap,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success === true) {
        const responseLinks = response.data.links || [];

        const normalized_base_url = response.data.base_url || null;
        dispatch(setBaseURL(normalized_base_url));

        // Clean and deduplicate links from response
        const cleanedLinks = cleanAndDeduplicateLinks(responseLinks);

        // Get existing links set
        const existingLinksSet = new Set(
          knowledgeBaseLinks.map((item) => item.link)
        );
        const uniqueNewLinks = cleanedLinks.filter(
          (link) => !existingLinksSet.has(link)
        );

        if (uniqueNewLinks.length > 0) {
          // Add new links with checked: true by default
          dispatch(
            addKnowledgeBaseLinks({ links: uniqueNewLinks, checked: true })
          );
          toast.success(
            response.data.message ||
              `Successfully extracted ${uniqueNewLinks.length} new unique URLs from sitemap`
          );
        } else {
          toast.info(
            "All extracted links are already in the list or were filtered out"
          );
        }
        setOpen(false);
      } else {
        toast.error(
          response.data.message || "Failed to extract links from sitemap"
        );
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch links from sitemap. Please check the URL and try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <PrimaryButton className="bg-deep-onyx text-white flex items-center justify-center text-[12px] font-semibold min-h-[41px]">
          <Network className="mr-0 md:mr-2" size={14} />
          <span className="hidden md:inline">Add Sitemap</span>
        </PrimaryButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Sitemap</DialogTitle>
          <DialogDescription>
            Add your sitemap URL to import your website pages.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-[4px] py-4">
          <p className="font-bold text-[13px]">Sitemap URL</p>
          <div className="grid gap-3">
            <CustomInput
              type="url"
              placeholder="Enter sitemap URL (e.g., https://example.com/sitemap.xml)"
              value={knowledgeBaseSitemap || ""}
              onChange={(e) =>
                dispatch(setKnowledgeBaseSitemap(e.target.value))
              }
              className="w-full px-[12px] py-[10px]"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <PrimaryButton className="bg-transparent border border-gray-300 dark:border-white text-gray-700 dark:text-white text-[12px] hover:bg-white dark:hover:bg-pure-mist dark:hover:text-deep-onyx">
              Cancel
            </PrimaryButton>
          </DialogClose>
          <PrimaryButton
            className="text-[12px] font-semibold flex items-center justify-center gap-2 min-w-[100px]"
            onClick={handleFetchSitemap}
            disabled={isLoading}
          >
            {isLoading ? (
              <Spinner className="border-white dark:border-deep-onyx" />
            ) : (
              <span>Fetch Links</span>
            )}
          </PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
