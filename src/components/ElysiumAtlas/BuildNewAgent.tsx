"use client";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import SetAgentName from "@/components/ElysiumAtlas/SetAgentName";
import SetKnowledgeBase from "@/components/ElysiumAtlas/SetKnowledgeBase";

export default function BuildNewAgent() {
  const currentStep = useSelector(
    (state: RootState) => state.agentBuilder.currentStep
  );

  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [isRedirecting, setIsRedirecting] = useState(false);

  if (isRedirecting || currentStep === 2) {
    return (
      <div className="h-full">
        <SetKnowledgeBase
          documentFiles={documentFiles}
          setDocumentFiles={setDocumentFiles}
          onBuildRedirectStart={() => setIsRedirecting(true)}
        />
      </div>
    );
  }

  if (currentStep === 1) {
    return (
      <div className="h-full">
        <SetAgentName />
      </div>
    );
  }

  return (
    <div className="h-full">
      <SetAgentName />
    </div>
  );
}
