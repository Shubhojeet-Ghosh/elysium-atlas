"use client";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { setKnowledgeBaseText } from "@/store/reducers/agentBuilderSlice";
import CustomTextareaPrimaryCyan from "@/components/inputs/CustomTextareaPrimaryCyan";

export default function KnowledgeBaseText() {
  const dispatch = useDispatch();
  const knowledgeBaseText = useSelector(
    (state: RootState) => state.agentBuilder.knowledgeBaseText
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="lg:text-[14px] text-[12px] font-bold">
        Text <span className="text-danger-red ml-[2px]">*</span>
      </div>
      <CustomTextareaPrimaryCyan
        placeholder="Enter knowledge base information as text..."
        value={knowledgeBaseText}
        onChange={(e) => dispatch(setKnowledgeBaseText(e.target.value))}
        className="w-full min-h-[200px]"
        rows={8}
      />
    </div>
  );
}

