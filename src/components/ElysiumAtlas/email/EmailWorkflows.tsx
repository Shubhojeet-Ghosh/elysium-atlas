"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Workflow } from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import EmailWorkflowBuilder from "@/components/ElysiumAtlas/email/workflow/EmailWorkflowBuilder";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const BUILD_MODE = "build";

export default function EmailWorkflows() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isBuildMode = searchParams.get("mode") === BUILD_MODE;

  const openBuilder = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", BUILD_MODE);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);

  const closeBuilder = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("mode");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (!isBuildMode) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isBuildMode]);

  return (
    <div
      className={
        isBuildMode
          ? "flex h-[calc(100dvh-65px-4rem)] max-h-[calc(100dvh-65px-4rem)] w-full flex-col overflow-hidden"
          : "flex h-full w-full min-h-0 flex-col"
      }
    >
      <div className="flex shrink-0 items-center justify-between">
        <div className="lg:text-[22px] text-[18px] font-bold">Workflows</div>
        {!isBuildMode ? (
          <PrimaryButton
            onClick={openBuilder}
            className="font-[600] flex items-center justify-center gap-2 min-w-[100px] min-h-[40px] text-[13px]"
          >
            <Plus size={16} className="-ml-1" />
            <span>Create Workflow</span>
          </PrimaryButton>
        ) : null}
      </div>

      {isBuildMode ? (
        <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden">
          <EmailWorkflowBuilder onClose={closeBuilder} />
        </div>
      ) : (
        <div className="mt-[24px] w-full overflow-hidden">
          <div className="relative">
            <div className="overflow-x-auto md:overflow-visible">
              <div className="inline-block min-w-full align-middle">
                <Table className="min-w-[640px] lg:min-w-full">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[220px] lg:w-[280px] font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                        Workflow Name
                      </TableHead>
                      <TableHead className="min-w-[140px] font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                        Status
                      </TableHead>
                      <TableHead className="min-w-[180px] pl-4 md:pl-8 lg:pl-12 font-[600] py-3 px-[10px] text-[14px] whitespace-nowrap">
                        Created
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={3}
                        className="py-8 text-center text-[13px] text-gray-500"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Workflow
                            size={20}
                            className="text-gray-400"
                            aria-hidden
                          />
                          <span>No workflows configured yet.</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
