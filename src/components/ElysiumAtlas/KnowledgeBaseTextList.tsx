"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import CustomInput from "@/components/inputs/CustomInput";
import CustomTextareaPrimary from "@/components/inputs/CustomTextareaPrimary";
import PrimaryButton from "@/components/ui/PrimaryButton";
import CancelButton from "@/components/ui/CancelButton";
import {
  updateKnowledgeBaseText,
  removeKnowledgeBaseText,
} from "@/store/reducers/agentBuilderSlice";
import OutlineButton from "@/components/ui/OutlineButton";
import { Trash2, Search } from "lucide-react";
import TablePaginationControls from "./TablePaginationControls";
import { useClientSideTablePagination } from "@/hooks/useClientSideTablePagination";
import { formatDateTime12hr } from "@/utils/formatDate";

interface KnowledgeBaseTextListProps {
  items?: never[];
  onEdit?: (index: number) => void;
  onRemove?: (index: number) => void;
  onAddMore?: () => void;
}

export default function KnowledgeBaseTextList({
  items: _items,
  onEdit: _onEdit,
  onRemove: _onRemove,
  onAddMore,
}: KnowledgeBaseTextListProps = {}) {
  const dispatch = useDispatch();
  const knowledgeBaseText = useSelector(
    (state: RootState) => state.agentBuilder.knowledgeBaseText
  );
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [alias, setAlias] = useState("");
  const [text, setText] = useState("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showRightGradient, setShowRightGradient] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter texts based on search term (alias or text content)
  const filteredTexts = useMemo(() => {
    if (!searchTerm.trim()) {
      return knowledgeBaseText;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return knowledgeBaseText.filter(
      (item) =>
        item.custom_text_alias.toLowerCase().includes(lowerSearchTerm) ||
        item.custom_text.toLowerCase().includes(lowerSearchTerm)
    );
  }, [knowledgeBaseText, searchTerm]);

  const sortedTexts = useMemo(() => {
    return [...filteredTexts]
      .map((item, originalIndex) => ({
        item,
        originalIndex: knowledgeBaseText.findIndex(
          (t) => t.custom_text_alias === item.custom_text_alias,
        ),
      }))
      .sort(
        (a, b) =>
          new Date(b.item.lastUpdated).getTime() -
          new Date(a.item.lastUpdated).getTime(),
      );
  }, [filteredTexts, knowledgeBaseText]);

  const {
    currentPage,
    totalPages,
    hasNext,
    hasPrev,
    total,
    pageSize,
    pageSizeOptions,
    paginatedItems: currentTexts,
    handlePageChange,
    handlePageSizeChange,
    resetPage,
  } = useClientSideTablePagination(sortedTexts);

  useEffect(() => {
    resetPage();
  }, [searchTerm, resetPage]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
      // Check if we're at or near the end (within 5px threshold)
      const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 5;
      setShowRightGradient(!isAtEnd);
    };

    // Check initial state
    handleScroll();

    scrollContainer.addEventListener("scroll", handleScroll);
    // Also check on resize
    window.addEventListener("resize", handleScroll);

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [currentTexts]);

  // Function to highlight matching text in alias
  const highlightMatch = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) {
      return text;
    }

    const lowerText = text.toLowerCase();
    const lowerSearchTerm = searchTerm.toLowerCase();
    const index = lowerText.indexOf(lowerSearchTerm);

    if (index === -1) {
      return text;
    }

    const beforeMatch = text.substring(0, index);
    const match = text.substring(index, index + searchTerm.length);
    const afterMatch = text.substring(index + searchTerm.length);

    return (
      <>
        {beforeMatch}
        <span className="bg-serene-purple/80 text-white font-semibold">
          {match}
        </span>
        {afterMatch}
      </>
    );
  };

  const emptyMessage = searchTerm
    ? `No entries found matching "${searchTerm}"`
    : "No text entries added yet";

  const handleRowClick = (aliasName: string) => {
    // Find the item by alias name in the Redux store
    const itemIndex = knowledgeBaseText.findIndex(
      (item) => item.custom_text_alias.toLowerCase() === aliasName.toLowerCase()
    );

    if (itemIndex !== -1) {
      const item = knowledgeBaseText[itemIndex];
      setSelectedIndex(itemIndex);
      setAlias(item.custom_text_alias);
      setText(item.custom_text);
      setOpen(true);
    }
  };

  const handleUpdate = () => {
    if (selectedIndex !== null && text.trim()) {
      dispatch(
        updateKnowledgeBaseText({
          index: selectedIndex,
          customText: {
            custom_text_alias: alias.trim(),
            custom_text: text.trim(),
            lastUpdated: new Date().toISOString(),
            status: "new",
          },
        })
      );
      setOpen(false);
      setSelectedIndex(null);
    }
  };

  const handleRemove = (aliasName: string) => {
    // Find the item by alias name in the Redux store
    const itemIndex = knowledgeBaseText.findIndex(
      (item) => item.custom_text_alias.toLowerCase() === aliasName.toLowerCase()
    );

    if (itemIndex !== -1) {
      dispatch(removeKnowledgeBaseText(itemIndex));
    }
  };

  return (
    <>
      <div className="w-full mt-[12px] overflow-hidden">
        {/* Search Bar */}
        <div className="flex items-center justify-between mb-4 px-0">
          <div className="lg:text-[14px] text-[12px] font-bold text-deep-onyx dark:text-pure-mist">
            Text Entries ({knowledgeBaseText.length})
            {searchTerm && (
              <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">
                ({filteredTexts.length} found)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onAddMore && (
              <OutlineButton
                className="text-[12px] font-bold px-3 py-1 h-8"
                onClick={onAddMore}
              >
                <span className="text-[18px]">+</span>{" "}
                <span className="hidden md:inline">Add More</span>
              </OutlineButton>
            )}
            <div className="relative w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <CustomInput
                type="text"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-[11px] h-8"
              />
            </div>
          </div>
        </div>

        <TablePaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          hasNext={hasNext}
          hasPrev={hasPrev}
          total={total}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />

        <div className="relative">
            <div
              ref={scrollContainerRef}
              className="overflow-x-auto md:overflow-visible"
            >
              <div className="inline-block min-w-full align-middle">
                <Table className="min-w-[600px] lg:min-w-full">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="min-w-[120px] lg:min-w-[100px] lg:max-w-[200px] font-[600] py-2 lg:px-4 px-0 whitespace-nowrap">
                        Text alias
                      </TableHead>
                      <TableHead className="min-w-[200px] pl-4 md:pl-8 lg:pl-12 font-[600] py-2 lg:px-4 px-0 whitespace-nowrap">
                        Last updated
                      </TableHead>
                      <TableHead className="w-[60px] md:w-[80px] text-right font-[600] py-2 lg:px-4 px-0 whitespace-nowrap"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentTexts.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={3}
                          className="py-10 text-center text-[12px] text-gray-500 dark:text-gray-400"
                        >
                          {emptyMessage}
                        </TableCell>
                      </TableRow>
                    ) : (
                    currentTexts.map(
                      ({ item, originalIndex }, displayIndex) => {
                        const alias =
                          item.custom_text_alias || `Text ${displayIndex + 1}`;
                        const matchesAlias =
                          searchTerm.trim() &&
                          item.custom_text_alias
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase());

                        return (
                          <TableRow
                            key={
                              item.custom_text_alias || `text-${originalIndex}`
                            }
                            onClick={() =>
                              handleRowClick(item.custom_text_alias)
                            }
                            className="cursor-pointer hover:bg-serene-purple/10 dark:hover:bg-serene-purple/20 hover:text-serene-purple dark:hover:text-serene-purple transition-all duration-200"
                          >
                            <TableCell className="font-medium min-w-[120px] lg:min-w-[100px] lg:max-w-[200px] py-2 lg:px-4 px-0 text-[12px] whitespace-nowrap">
                              <div className="truncate">
                                {matchesAlias
                                  ? highlightMatch(alias, searchTerm)
                                  : alias}
                              </div>
                            </TableCell>
                            <TableCell className="min-w-[200px] pl-4 md:pl-8 lg:pl-12 py-2 lg:px-4 px-0 text-[12px] whitespace-nowrap">
                              {formatDateTime12hr(item.lastUpdated)}
                            </TableCell>
                            <TableCell className="w-[60px] md:w-[80px] text-right py-2 lg:px-4 px-0 whitespace-nowrap">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemove(item.custom_text_alias);
                                }}
                                className="p-2 rounded-[8px] text-danger-red hover:bg-danger-red hover:text-white transition-colors cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      },
                    )
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            {showRightGradient && currentTexts.length > 0 && (
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-black dark:via-black/80 to-transparent pointer-events-none z-10 md:hidden" />
            )}
          </div>
      </div>

      <Sheet
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setSelectedIndex(null);
            setAlias("");
            setText("");
          }
        }}
      >
        <SheetContent className="min-w-full lg:min-w-[480px] md:min-w-full z-[110] px-[4px]">
          <SheetHeader>
            <SheetTitle>Edit Text Entry</SheetTitle>
            <SheetDescription className="font-medium">
              Make changes to your text entry here. Click save when you&apos;re
              done.
            </SheetDescription>
          </SheetHeader>
          <div className="grid flex-1 auto-rows-min gap-6 px-4 py-6">
            <div className="grid gap-3">
              <Label htmlFor="text-alias">Text alias</Label>
              <CustomInput
                id="text-alias"
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Enter text alias"
                className="w-full px-[12px] py-[10px]"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="text-content">Text</Label>
              <CustomTextareaPrimary
                id="text-content"
                placeholder="Enter your custom text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full"
                rows={8}
              />
            </div>
          </div>
          <SheetFooter className="flex-col gap-2">
            <PrimaryButton
              type="button"
              onClick={handleUpdate}
              disabled={!text.trim()}
              className="w-full text-[12px] font-semibold"
            >
              Save changes
            </PrimaryButton>
            <SheetClose asChild>
              <CancelButton
                type="button"
                className="w-full text-[12px] font-semibold "
              >
                Cancel
              </CancelButton>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
