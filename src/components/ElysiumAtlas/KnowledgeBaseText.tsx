"use client";
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import {
  addKnowledgeBaseText,
  updateKnowledgeBaseText,
  removeKnowledgeBaseText,
} from "@/store/reducers/agentBuilderSlice";
import CustomInput from "@/components/inputs/CustomInput";
import CustomTextareaPrimary from "@/components/inputs/CustomTextareaPrimary";
import PrimaryButton from "@/components/ui/PrimaryButton";
import InfoIcon from "@/components/ui/InfoIcon";
import CancelButton from "../ui/CancelButton";
import KnowledgeBaseTextList from "./KnowledgeBaseTextList";
import { toast } from "sonner";

export default function KnowledgeBaseText() {
  const dispatch = useDispatch();
  const knowledgeBaseText = useSelector(
    (state: RootState) => state.agentBuilder.knowledgeBaseText
  );

  const [alias, setAlias] = useState("");
  const [text, setText] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAdd = () => {
    if (!text.trim()) {
      return;
    }
    if (editingIndex !== null) {
      dispatch(
        updateKnowledgeBaseText({
          index: editingIndex,
          customText: {
            custom_text_alias: alias.trim(),
            custom_text: text.trim(),
            lastUpdated: new Date().toISOString(),
          },
        })
      );
      setEditingIndex(null);
    } else {
      // Check for duplicate alias when adding new entry
      const trimmedAlias = alias.trim();
      const duplicateExists = knowledgeBaseText.some(
        (item, index) =>
          item.custom_text_alias.toLowerCase() === trimmedAlias.toLowerCase()
      );

      if (duplicateExists) {
        toast.error(
          "An entry with this alias name already exists. Please use a different alias."
        );
        return;
      }

      dispatch(
        addKnowledgeBaseText({
          custom_text_alias: trimmedAlias,
          custom_text: text.trim(),
          lastUpdated: new Date().toISOString(),
        })
      );
    }
    setAlias("");
    setText("");
  };

  const handleCancel = () => {
    setAlias("");
    setText("");
    setEditingIndex(null);
  };

  return (
    <div className="flex flex-col">
      {/* Add/Edit Form */}
      <div className="flex flex-col gap-[16px]">
        <div className="flex flex-col gap-[4px]">
          <div className="lg:text-[14px] text-[12px] font-bold mt-[4px] flex items-center gap-2">
            Text alias <span className="text-danger-red ml-[2px]">*</span>
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
            Text <span className="text-danger-red ml-[2px]">*</span>
          </div>
          <CustomTextareaPrimary
            placeholder="Enter your custom text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full"
            rows={6}
          />
        </div>

        <div className="flex items-center gap-2 justify-end">
          <PrimaryButton
            className="text-[12px] font-semibold flex items-center justify-center gap-2 min-w-[80px] min-h-[36px]"
            onClick={handleAdd}
            disabled={!text.trim()}
          >
            {editingIndex !== null ? "Update" : "Add"}
          </PrimaryButton>
          {editingIndex !== null && (
            <CancelButton
              className="text-[12px] font-semibold flex items-center justify-center gap-2 min-w-[80px] min-h-[36px]"
              onClick={handleCancel}
            >
              Cancel
            </CancelButton>
          )}
        </div>
      </div>

      {/* List of Text Entries */}
      <KnowledgeBaseTextList />
    </div>
  );
}
