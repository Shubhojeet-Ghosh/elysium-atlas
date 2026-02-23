"use client";

import { AnimatePresence } from "framer-motion";
import NewChatComponent from "@/components/ElysiumAtlas/NewChatComponent";

interface ChatOptionsDropdownProps {
  open: boolean;
  onNewChat?: () => void;
}

export default function ChatOptionsDropdown({
  open,
  onNewChat,
}: ChatOptionsDropdownProps) {
  return (
    <AnimatePresence>
      {open && <NewChatComponent onNewChat={onNewChat} />}
    </AnimatePresence>
  );
}
