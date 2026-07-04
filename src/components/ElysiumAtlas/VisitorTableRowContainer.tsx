"use client";

import { memo } from "react";
import { useAppSelector } from "@/store";
import VisitorTableRow from "./VisitorTableRow";

type VisitorTableRowContainerProps = {
  chatSessionId: string;
  userID: string | null;
  isSearchActive: boolean;
  debouncedSearchQuery: string;
  onSelect: (chatSessionId: string) => void;
};

function VisitorTableRowContainer({
  chatSessionId,
  userID,
  isSearchActive,
  debouncedSearchQuery,
  onSelect,
}: VisitorTableRowContainerProps) {
  const visitor = useAppSelector(
    (state) =>
      state.agent.active_visitors.find(
        (v) => v.chat_session_id === chatSessionId,
      ) ?? null,
  );

  if (!visitor) return null;

  return (
    <VisitorTableRow
      visitor={visitor}
      userID={userID}
      isSearchActive={isSearchActive}
      debouncedSearchQuery={debouncedSearchQuery}
      onSelect={onSelect}
    />
  );
}

export default memo(VisitorTableRowContainer);
