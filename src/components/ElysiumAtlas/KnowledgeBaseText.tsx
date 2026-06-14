"use client";
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { addKnowledgeBaseText } from "@/store/reducers/agentBuilderSlice";
import CustomInput from "@/components/inputs/CustomInput";
import CustomTextareaPrimary from "@/components/inputs/CustomTextareaPrimary";
import PrimaryButton from "@/components/ui/PrimaryButton";
import InfoIcon from "@/components/ui/InfoIcon";
import CancelButton from "../ui/CancelButton";
import KnowledgeBaseTextList from "./KnowledgeBaseTextList";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function KnowledgeBaseText() {
  const dispatch = useDispatch();
  const knowledgeBaseText = useSelector(
    (state: RootState) => state.agentBuilder.knowledgeBaseText,
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [alias, setAlias] = useState("");
  const [text, setText] = useState("");

  const resetForm = () => {
    setAlias("");
    setText("");
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setDialogOpen(open);
  };

  const handleAdd = () => {
    if (!alias.trim() || !text.trim()) {
      return;
    }

    const trimmedAlias = alias.trim();
    const duplicateExists = knowledgeBaseText.some(
      (item) =>
        item.custom_text_alias.toLowerCase() === trimmedAlias.toLowerCase(),
    );

    if (duplicateExists) {
      toast.error(
        "An entry with this alias name already exists. Please use a different alias.",
      );
      return;
    }

    dispatch(
      addKnowledgeBaseText({
        custom_text_alias: trimmedAlias,
        custom_text: text.trim(),
        lastUpdated: new Date().toISOString(),
        status: "new",
      }),
    );
    resetForm();
    toast.success("Text entry added");
  };

  const handleCancel = () => {
    resetForm();
    setDialogOpen(false);
  };

  return (
    <>
      <div className="flex flex-col">
        <KnowledgeBaseTextList onAddMore={() => setDialogOpen(true)} />
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Add Text Entry</DialogTitle>
            <DialogDescription>
              Add custom text to your agent&apos;s knowledge base.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-[16px] py-2">
            <div className="flex flex-col gap-[4px]">
              <div className="lg:text-[14px] text-[12px] font-bold mt-[4px] flex items-center gap-1.5">
                <span>
                  Text alias <span className="text-danger-red">*</span>
                </span>
                <InfoIcon
                  className="text-[12px]"
                  text="A text alias is a short name or identifier for your custom text entry. It helps you organize and identify different text entries easily."
                />
              </div>
              <CustomInput
                type="text"
                placeholder="Enter text alias"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                className="w-full px-[12px] py-[10px]"
              />
            </div>
            <div className="flex flex-col gap-[4px]">
              <div className="lg:text-[14px] text-[12px] font-bold mt-[4px]">
                Text <span className="text-danger-red">*</span>
              </div>
              <CustomTextareaPrimary
                placeholder="Enter your custom text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full"
                rows={6}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <CancelButton
                className="text-[12px] font-semibold flex items-center justify-center gap-2 min-w-[80px] min-h-[36px]"
                onClick={handleCancel}
              >
                Done
              </CancelButton>
            </DialogClose>
            <PrimaryButton
              className="text-[12px] font-semibold flex items-center justify-center gap-2 min-w-[80px] min-h-[36px]"
              onClick={handleAdd}
              disabled={!alias.trim() || !text.trim()}
            >
              Add
            </PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
