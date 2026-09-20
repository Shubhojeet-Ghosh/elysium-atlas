import { useEffect, useState } from "react";
import CustomSelector from "@/components/ui/CustomSelector";
import CustomInput from "@/components/inputs/CustomInput";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Search } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store";
import {
  setRetrievalStrategy,
  updateLlmContextConfig,
} from "@/store/reducers/agentSlice";
import AutoComplete from "@/components/ui/AutoComplete";
import {
  getRetrievalStrategyLabel,
  RETRIEVAL_STRATEGIES,
} from "@/lib/retrievalStrategyConfig";
import { SHEET_CONTENT_CLASSNAME } from "@/lib/sheetConfig";
import { useAgentReadOnly } from "@/hooks/useCanManageAgents";
import {
  clampChatHistoryMessages,
  DEFAULT_LLM_CONTEXT_CONFIG,
  MAX_CHAT_HISTORY_MESSAGES,
} from "@/lib/llmContextConfig";

function parseNumericInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export default function RetrievalStrategySelector() {
  const [open, setOpen] = useState(false);
  const retrievalStrategy = useAppSelector(
    (state) => state.agent.retrievalStrategy,
  );
  const maxChatHistoryMessages = useAppSelector(
    (state) =>
      state.agent.llmContextConfig?.max_chat_history_messages ??
      DEFAULT_LLM_CONTEXT_CONFIG.max_chat_history_messages,
  );
  const [chatHistoryInput, setChatHistoryInput] = useState(
    String(maxChatHistoryMessages),
  );
  const dispatch = useAppDispatch();
  const readOnly = useAgentReadOnly();

  useEffect(() => {
    setChatHistoryInput(String(maxChatHistoryMessages));
  }, [maxChatHistoryMessages]);

  const strategyItems = RETRIEVAL_STRATEGIES.map((strategy) => ({
    value: strategy.value,
    label: strategy.label,
  }));

  const commitChatHistory = (raw: string) => {
    const parsed = parseNumericInput(raw);
    const clamped = clampChatHistoryMessages(
      parsed ?? maxChatHistoryMessages,
    );
    setChatHistoryInput(String(clamped));
    dispatch(
      updateLlmContextConfig({
        max_chat_history_messages: clamped,
      }),
    );
  };

  const handleChatHistoryChange = (value: string) => {
    if (value !== "" && !/^\d+$/.test(value)) return;

    setChatHistoryInput(value);

    const parsed = parseNumericInput(value);
    if (parsed === null) return;

    dispatch(
      updateLlmContextConfig({
        max_chat_history_messages: clampChatHistoryMessages(parsed),
      }),
    );
  };

  return (
    <>
      <div className="w-full">
        <div className="flex flex-col gap-2">
          <div>
            <label className="text-[14px] font-[600] text-deep-onyx dark:text-pure-mist">
              Retrieval Strategy
            </label>
            <p className="text-[14px] font-[500] text-gray-500 dark:text-gray-400 mt-[2px]">
              Choose how knowledge sources should be retrieved for this agent.
            </p>
          </div>

          <CustomSelector
            label="Retrieval Strategy"
            value={getRetrievalStrategyLabel(retrievalStrategy)}
            className={`px-[10px] py-[12px] ${readOnly ? "pointer-events-none opacity-60" : ""}`}
            onClick={() => {
              if (!readOnly) setOpen(true);
            }}
          />
        </div>
      </div>

      <Sheet
        open={open}
        onOpenChange={(nextOpen) => {
          if (!readOnly) setOpen(nextOpen);
        }}
      >
        <SheetContent className={SHEET_CONTENT_CLASSNAME}>
          <SheetHeader>
            <SheetTitle>
              <div className="flex items-center justify-start">
                <Search className="inline mr-2" size={18} />
                <p>Retrieval Strategy</p>
              </div>
            </SheetTitle>
            <SheetDescription>
              Choose how knowledge sources should be retrieved for this agent.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 px-4">
            <AutoComplete
              items={strategyItems}
              value={retrievalStrategy}
              placeholder="Select retrieval strategy..."
              searchPlaceholder="Search strategy..."
              emptyMessage="No strategy found."
              onChange={(value) => dispatch(setRetrievalStrategy(value))}
              className="text-[13px] font-[500]"
              disabled={readOnly}
            />
          </div>
          <div className="mt-4 px-4">
            <label className="text-sm font-medium">Chat history</label>
            <p className="text-xs text-muted-foreground">
              How many past user and agent messages to send to the main agent
              LLM. Maximum {MAX_CHAT_HISTORY_MESSAGES}.
            </p>
            <CustomInput
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={chatHistoryInput}
              disabled={readOnly}
              onChange={(e) => handleChatHistoryChange(e.target.value)}
              onBlur={() => commitChatHistory(chatHistoryInput)}
              className="mt-[10px] px-[10px] py-[12px] text-[13px] font-[500]"
              aria-label="Chat history messages"
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
