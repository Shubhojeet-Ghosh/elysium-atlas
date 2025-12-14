"use client";
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import {
  addKnowledgeBaseQnA,
  updateKnowledgeBaseQnA,
  removeKnowledgeBaseQnA,
} from "@/store/reducers/agentBuilderSlice";
import CustomInput from "@/components/inputs/CustomInput";
import CustomTextareaPrimary from "@/components/inputs/CustomTextareaPrimary";
import PrimaryButton from "@/components/ui/PrimaryButton";
import InfoIcon from "@/components/ui/InfoIcon";
import CancelButton from "../ui/CancelButton";
import KnowledgeBaseQnAList from "./KnowledgeBaseQnAList";
import { toast } from "sonner";

export default function KnowledgeBaseQnA() {
  const dispatch = useDispatch();
  const knowledgeBaseQnA = useSelector(
    (state: RootState) => state.agentBuilder.knowledgeBaseQnA
  );

  const [alias, setAlias] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAdd = () => {
    if (!question.trim() || !answer.trim()) {
      return;
    }
    if (editingIndex !== null) {
      dispatch(
        updateKnowledgeBaseQnA({
          index: editingIndex,
          qna: {
            qna_alias: alias.trim(),
            question: question.trim(),
            answer: answer.trim(),
            lastUpdated: new Date().toISOString(),
          },
        })
      );
      setEditingIndex(null);
    } else {
      // Check for duplicate alias when adding new entry
      const trimmedAlias = alias.trim();
      const duplicateExists = knowledgeBaseQnA.some(
        (item, index) =>
          item.qna_alias.toLowerCase() === trimmedAlias.toLowerCase()
      );

      if (duplicateExists) {
        toast.error(
          "An entry with this alias name already exists. Please use a different alias."
        );
        return;
      }

      dispatch(
        addKnowledgeBaseQnA({
          qna_alias: trimmedAlias,
          question: question.trim(),
          answer: answer.trim(),
          lastUpdated: new Date().toISOString(),
        })
      );
    }
    setAlias("");
    setQuestion("");
    setAnswer("");
  };

  const handleCancel = () => {
    setAlias("");
    setQuestion("");
    setAnswer("");
    setEditingIndex(null);
  };

  return (
    <div className="flex flex-col">
      {/* Add/Edit Form */}
      <div className="flex flex-col gap-[16px]">
        <div className="flex flex-col gap-[4px]">
          <div className="lg:text-[14px] text-[12px] font-bold mt-[4px] flex items-center gap-1.5">
            <span>
              QnA alias <span className="text-danger-red">*</span>
            </span>
            <InfoIcon
              className="text-[12px]"
              text="A QnA alias is a short name or identifier for your question and answer pair. It helps you organize and identify different QnA entries easily."
            />
          </div>
          <CustomInput
            type="text"
            placeholder="Enter QnA alias"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            className="w-full px-[12px] py-[10px]"
          />
        </div>
        <div className="flex flex-col md:flex-row gap-[16px] md:gap-4">
          <div className="flex flex-col gap-[4px] flex-1">
            <div className="lg:text-[14px] text-[12px] font-bold mt-[4px]">
              Question <span className="text-danger-red">*</span>
            </div>
            <CustomTextareaPrimary
              placeholder="Enter your question here..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full"
              rows={4}
            />
          </div>
          <div className="flex flex-col gap-[4px] flex-1">
            <div className="lg:text-[14px] text-[12px] font-bold mt-[4px]">
              Answer <span className="text-danger-red">*</span>
            </div>
            <CustomTextareaPrimary
              placeholder="Enter your answer here..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full"
              rows={4}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <PrimaryButton
            className="text-[12px] font-semibold flex items-center justify-center gap-2 min-w-[80px] min-h-[36px]"
            onClick={handleAdd}
            disabled={!alias.trim() || !question.trim() || !answer.trim()}
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

      {/* List of QnA Entries */}
      <KnowledgeBaseQnAList />
    </div>
  );
}
