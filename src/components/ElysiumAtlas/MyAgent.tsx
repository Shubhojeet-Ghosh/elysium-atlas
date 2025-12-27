import { useState } from "react";
import { CustomTabs } from "@/components/ui/CustomTabs";
import AgentBuilderTabs from "./AgentBuilderTabs";
import SystemPrompt from "./SystemPrompt";
import CustomInput from "@/components/inputs/CustomInput";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { setAgentName } from "@/store/reducers/agentSlice";

export default function MyAgent() {
  const [activeTab, setActiveTab] = useState("agent");
  const dispatch = useDispatch();
  const agentName = useSelector((state: RootState) => state.agent.agentName);

  return (
    <>
      <CustomTabs value={activeTab} onValueChange={setActiveTab}>
        <AgentBuilderTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </CustomTabs>
      <div className="flex flex-col lg:px-[40px] px-0">
        <div className="lg:mt-[50px] mt-[20px]">
          <p className="text-[24px] font-[700]">Agent</p>
        </div>
        <div className="flex lg:flex-row flex-col gap-[16px] mt-[30px]">
          <div className="lg:w-[60%] w-full">
            <div>
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-[600] text-deep-onyx dark:text-pure-mist">
                  Agent Name
                </label>
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
          </div>
          {/* <div className="lg:w-[40%] w-full">Hello</div> */}
        </div>
      </div>
    </>
  );
}
