import CustomInput from "@/components/inputs/CustomInput";
import SystemPrompt from "./SystemPrompt";
import WelcomeMessage from "./WelcomeMessage";
import { useAppSelector, useAppDispatch } from "@/store";
import { setAgentName } from "@/store/reducers/agentSlice";

export default function AgentLeftSide() {
  const dispatch = useAppDispatch();
  const agentName = useAppSelector((state) => state.agent.agentName);

  return (
    <div className="lg:w-[60%] w-full">
      <div>
        <div className="flex flex-col gap-2">
          <div>
            <label className="text-[14px] font-[600] text-deep-onyx dark:text-pure-mist">
              Agent Name
            </label>
            <p className="text-[14px] font-[500] text-gray-500 dark:text-gray-400 mt-[2px]">
              Unique name for your AI agent.
            </p>
          </div>

          <CustomInput
            className="px-[10px] py-[12px] "
            type="text"
            placeholder="Enter agent name"
            value={agentName}
            onChange={(e) => dispatch(setAgentName(e.target.value))}
          />
        </div>
      </div>
      <div className="mt-[40px]">
        <SystemPrompt />
      </div>
      <div className="mt-[40px]">
        <WelcomeMessage />
      </div>
    </div>
  );
}
