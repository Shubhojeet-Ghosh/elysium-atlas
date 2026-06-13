import { useAppSelector, useAppDispatch } from "@/store";
import { setRetrievalStrategy } from "@/store/reducers/agentSlice";
import AutoComplete from "@/components/ui/AutoComplete";
import { RETRIEVAL_STRATEGIES } from "@/lib/retrievalStrategyConfig";
import { useAgentReadOnly } from "@/hooks/useCanManageAgents";

export default function RetrievalStrategySelector() {
  const retrievalStrategy = useAppSelector(
    (state) => state.agent.retrievalStrategy,
  );
  const dispatch = useAppDispatch();
  const readOnly = useAgentReadOnly();

  const strategyItems = RETRIEVAL_STRATEGIES.map((strategy) => ({
    value: strategy.value,
    label: strategy.label,
  }));

  return (
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
    </div>
  );
}
