"use client";

import { useState } from "react";
import { Network } from "lucide-react";
import { toast } from "sonner";
import CustomInput from "@/components/inputs/CustomInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import Spinner from "@/components/ui/Spinner";
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
import { extractUrlLinks } from "@/utils/kbItemsApi";
import { cleanAndDeduplicateLinks } from "@/utils/linkUtils";
import { extractApiErrorMessage } from "@/utils/toolsFormUtils";

interface TeamKbAddSitemapDialogProps {
  existingUrls: string[];
  onLinksAdded: (
    links: string[],
    normalizedBaseUrl?: string | null,
  ) => void | Promise<void>;
  triggerClassName?: string;
}

export default function TeamKbAddSitemapDialog({
  existingUrls,
  onLinksAdded,
  triggerClassName,
}: TeamKbAddSitemapDialogProps) {
  const [open, setOpen] = useState(false);
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateSitemapURL = (url: string): boolean => {
    return Boolean(url && url.trim().length > 0);
  };

  const handleFetchSitemap = async () => {
    if (!validateSitemapURL(sitemapUrl)) {
      toast.error("Please enter a valid sitemap URL");
      return;
    }

    setIsLoading(true);
    try {
      const response = await extractUrlLinks("sitemap", sitemapUrl);

      if (response.success === true) {
        const responseLinks: string[] = response.links ?? [];
        const normalizedBaseUrl = response.base_url ?? null;
        const cleanedLinks = cleanAndDeduplicateLinks(responseLinks);
        const existingSet = new Set(existingUrls);
        const uniqueNewLinks = cleanedLinks.filter(
          (link) => !existingSet.has(link),
        );

        if (uniqueNewLinks.length > 0) {
          await onLinksAdded(uniqueNewLinks, normalizedBaseUrl);
          toast.success(
            response.message ||
              `Successfully extracted ${uniqueNewLinks.length} new unique URLs from sitemap`,
          );
        } else {
          toast.info(
            "All extracted links are already in the list or were filtered out",
          );
        }
        setOpen(false);
      } else {
        toast.error(
          response.message || "Failed to extract links from sitemap",
        );
      }
    } catch (error: unknown) {
      toast.error(
        extractApiErrorMessage(
          error,
          "Failed to fetch links from sitemap. Please check the URL and try again.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <PrimaryButton
          className={
            triggerClassName
              ? `${triggerClassName} bg-deep-onyx text-white`
              : "bg-deep-onyx text-white flex items-center justify-center text-[12px] font-semibold min-h-[41px]"
          }
        >
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
              value={sitemapUrl}
              onChange={(e) => setSitemapUrl(e.target.value)}
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
