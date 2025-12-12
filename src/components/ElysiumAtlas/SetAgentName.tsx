"use client";
import CustomInput from "@/components/inputs/CustomInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import BackButton from "@/components/ui/BackButton";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import {
  setAgentName,
  setCurrentStep,
} from "@/store/reducers/agentBuilderSlice";
import { useRouter } from "next/navigation";

export default function SetAgentName() {
  const dispatch = useDispatch();
  const agentName = useSelector(
    (state: RootState) => state.agentBuilder.agentName
  );
  const router = useRouter();
  const handleContinue = () => {
    dispatch(setCurrentStep(2));
  };

  const handleBack = () => {
    dispatch(setCurrentStep(0));
    router.push("/my-agents");
  };

  return (
    <div className="flex flex-col justify-between h-full lg:pb-[40px] pb-[20px]">
      <div className="lg:mt-[120px] md:mt-[300px] mt-[140px]">
        <div className="lg:text-[22px] text-[18px] font-bold flex flex-wrap items-center gap-1 md:gap-2 text-deep-onyx dark:text-pure-mist">
          Name your agent
        </div>
        <div className="lg:text-[16px] text-[14px] font-[600] mt-[2px] text-gray-500 dark:text-pure-mist">
          Choose a name that reflects your agent's purpose
        </div>
        <div className="flex flex-col gap-[8px] mt-6 md:mt-8 lg:mt-[40px]">
          <div className="lg:text-[14px] text-[12px] font-bold">
            Agent Name <span className="text-danger-red ml-[2px]">*</span>
          </div>
          <div>
            <CustomInput
              type="text"
              placeholder="Enter agent name"
              value={agentName}
              onChange={(e) => dispatch(setAgentName(e.target.value))}
              className="w-full px-[10px] py-[12px] text-[14px] "
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-[30px]">
        <BackButton onClick={handleBack}>Back</BackButton>
        <PrimaryButton
          onClick={handleContinue}
          disabled={!agentName}
          className="font-[600]"
        >
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
}
