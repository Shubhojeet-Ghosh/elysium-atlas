"use client";

import { Plus, Search } from "lucide-react";
import PrimaryButton from "@/components/ui/PrimaryButton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function SkeletonBar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 dark:bg-white/10 ${className}`}
    />
  );
}

const SKELETON_ROW_COUNT = 5;

export default function MyAgentsSkeleton() {
  return (
    <div className="w-full h-full">
      <div className="flex flex-col">
        <div className="lg:text-[22px] text-[18px] font-bold flex justify-between items-center">
          <div>Agents</div>
          <PrimaryButton
            disabled
            className="font-[600] flex items-center justify-center gap-2 min-w-[100px] min-h-[40px] text-[13px] opacity-60 cursor-default pointer-events-none"
          >
            <Plus size={16} className="-ml-1" />
            <span>New Agent</span>
          </PrimaryButton>
        </div>

        <div className="w-full mt-[24px] overflow-hidden">
          <div className="flex justify-end mb-[2px]">
            <div className="relative lg:w-[280px] w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 z-10" />
              <div className="h-10 w-full rounded-[10px] border-[2px] border-gray-300 dark:border-deep-onyx bg-gray-100 dark:bg-white/5 animate-pulse" />
            </div>
          </div>

          <div className="relative">
            <div className="overflow-x-auto md:overflow-visible">
              <div className="inline-block min-w-full align-middle">
                <Table className="min-w-[600px] lg:min-w-full">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[200px] lg:w-[300px] font-[600] py-2 px-[10px] text-[14px] whitespace-nowrap">
                        Name
                      </TableHead>
                      <TableHead className="min-w-[120px] lg:min-w-[100px] lg:max-w-[200px] font-[600] py-2 px-[10px] text-[14px] whitespace-nowrap">
                        Status
                      </TableHead>
                      <TableHead className="min-w-[200px] pl-4 md:pl-8 lg:pl-12 font-[600] py-2 px-[10px] text-[14px] whitespace-nowrap">
                        Last Updated
                      </TableHead>
                      <TableHead className="w-[40px] md:w-[60px] py-2 px-[10px] text-[14px] whitespace-nowrap" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: SKELETON_ROW_COUNT }).map(
                      (_, index) => (
                        <TableRow
                          key={index}
                          className="border-b border-gray-100 dark:border-deep-onyx"
                        >
                          <TableCell className="font-medium w-[300px] py-2 px-[10px] text-[14px] whitespace-nowrap">
                            <SkeletonBar className="h-4 w-[140px] max-w-full" />
                          </TableCell>
                          <TableCell className="font-medium min-w-[120px] lg:min-w-[100px] lg:max-w-[200px] py-2 px-[10px] text-[14px] whitespace-nowrap">
                            <SkeletonBar className="h-5 w-[52px] rounded-full" />
                          </TableCell>
                          <TableCell className="min-w-[200px] pl-4 md:pl-8 lg:pl-12 py-2 px-[10px] text-[14px] whitespace-nowrap">
                            <SkeletonBar className="h-4 w-[168px] max-w-full" />
                          </TableCell>
                          <TableCell className="w-[40px] md:w-[60px] py-2 px-[10px] text-right">
                            <div className="mx-auto flex h-[30px] w-[30px] items-center justify-center">
                              <SkeletonBar className="h-[18px] w-[18px] rounded-sm" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
