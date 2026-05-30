import LlmModelSelector from "./LlmModelSelector";
import RetrievalStrategySelector from "./RetrievalStrategySelector";

export default function AgentRightSide() {
  return (
    <div className="flex flex-col gap-[30px] w-full">
      <LlmModelSelector />
      <RetrievalStrategySelector />
    </div>
  );
}
