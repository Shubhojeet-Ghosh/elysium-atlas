"use client";

import TeamKbLinks from "./TeamKbLinks";
import TeamKbFiles from "./TeamKbFiles";
import TeamKbText from "./TeamKbText";
import TeamKbQnA from "./TeamKbQnA";

interface TeamKbDataSourceProps {
  activeTab: string;
  documentFiles: File[];
  setDocumentFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

export default function TeamKbDataSource({
  activeTab,
  documentFiles,
  setDocumentFiles,
}: TeamKbDataSourceProps) {
  return (
    <div className="mt-4 pb-4 md:pb-6">
      <div className={activeTab === "links" ? "" : "hidden"}>
        <TeamKbLinks />
      </div>
      <div className={activeTab === "files" ? "" : "hidden"}>
        <TeamKbFiles
          documentFiles={documentFiles}
          setDocumentFiles={setDocumentFiles}
        />
      </div>
      <div className={activeTab === "text" ? "" : "hidden"}>
        <TeamKbText />
      </div>
      <div className={activeTab === "qna" ? "" : "hidden"}>
        <TeamKbQnA />
      </div>
    </div>
  );
}
