"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import SetAgentName from "@/components/ElysiumAtlas/SetAgentName";
import SetKnowledgeBase from "@/components/ElysiumAtlas/SetKnowledgeBase";

export default function BuildNewAgent() {
  const router = useRouter();
  const currentStep = useSelector(
    (state: RootState) => state.agentBuilder.currentStep
  );
  const agentName = useSelector(
    (state: RootState) => state.agentBuilder.agentName
  );

  const [documentFiles, setDocumentFiles] = useState<File[]>([]);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <SetAgentName />;
      case 2:
        return (
          <SetKnowledgeBase
            documentFiles={documentFiles}
            setDocumentFiles={setDocumentFiles}
          />
        );
      default:
        return <SetAgentName />;
    }
  };

  return <div className="w-full">{renderStep()}</div>;
}
