"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
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

interface TeamKbAddWebsiteDialogProps {
  existingUrls: string[];
  onLinksAdded: (links: string[]) => void | Promise<void>;
  triggerClassName?: string;
}

export default function TeamKbAddWebsiteDialog({
  existingUrls,
  onLinksAdded,
  triggerClassName,
}: TeamKbAddWebsiteDialogProps) {
  const [open, setOpen] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setWebsiteUrl("");
    }
  };

  const handleExtractLinks = async () => {
    if (!websiteUrl.trim()) {
      toast.error("Please enter a valid website URL");
      return;
    }

    setIsLoading(true);
    try {
      const response = await extractUrlLinks("url", websiteUrl);

      if (response.success === true) {
        const responseLinks: string[] = response.links ?? [];
        const cleanedLinks = cleanAndDeduplicateLinks(responseLinks);
        const existingSet = new Set(existingUrls);
        const uniqueNewLinks = cleanedLinks.filter(
          (link) => !existingSet.has(link),
        );

        if (uniqueNewLinks.length > 0) {
          await onLinksAdded(uniqueNewLinks);
          toast.success(
            response.message ||
              `Successfully extracted ${uniqueNewLinks.length} new unique links from website`,
          );
        } else {
          toast.info(
            "All extracted links are already in the list or were filtered out",
          );
        }
        setOpen(false);
        setWebsiteUrl("");
      } else {
        toast.error(response.message || "Failed to extract links from website");
      }
    } catch (error: unknown) {
      toast.error(
        extractApiErrorMessage(
          error,
          "Failed to extract links from website. Please check the URL and try again.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <PrimaryButton
          className={
            triggerClassName ??
            "text-[12px] font-semibold flex items-center justify-center gap-2 min-h-[41px]"
          }
        >
          <Globe className="mr-0 md:mr-1" size={14} />
          <span className="hidden md:inline">Add Website</span>
        </PrimaryButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Website</DialogTitle>
          <DialogDescription>
            Enter a website URL to extract pages and add them to your knowledge
            base.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-[4px] py-4">
          <p className="font-bold text-[13px]">Website Link</p>
          <div className="grid gap-3">
            <CustomInput
              type="url"
              placeholder="Enter website URL (e.g., https://example.com)"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
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
            className="text-[12px] font-semibold flex items-center justify-center min-h-[40px]"
            onClick={handleExtractLinks}
            disabled={isLoading}
          >
            <span className="relative inline-flex items-center justify-center">
              <span className={isLoading ? "invisible" : undefined}>
                Extract Links
              </span>
              {isLoading ? (
                <Spinner className="absolute border-white dark:border-deep-onyx" />
              ) : null}
            </span>
          </PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
