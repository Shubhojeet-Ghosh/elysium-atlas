"use client";
import { useState } from "react";
import CustomInput from "@/components/inputs/CustomInput";
import PrimaryButton from "@/components/ui/PrimaryButton";
import BackButton from "@/components/ui/BackButton";
import Spinner from "@/components/ui/Spinner";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import {
  setAgentName,
  setAgentID,
  setCurrentStep,
} from "@/store/reducers/agentBuilderSlice";
import { useRouter } from "next/navigation";
import fastApiAxios from "@/utils/fastapi_axios";
import Cookies from "js-cookie";
import { toast } from "sonner";

export default function SetAgentName() {
  const dispatch = useDispatch();
  const agentName = useSelector(
    (state: RootState) => state.agentBuilder.agentName
  );
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const handleContinue = async () => {
    if (!agentName || agentName.trim() === "") {
      toast.error("Please enter an agent name");
      return;
    }

    setIsLoading(true);
    const token = Cookies.get("elysium_atlas_session_token");

    try {
      const response = await fastApiAxios.post(
        "/elysium-agents/elysium-atlas/agent/v1/pre-build-agent-operations",
        {
          agent_name: agentName.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success === true) {
        dispatch(setAgentID(response.data.agent_id));
        dispatch(setCurrentStep(2));
      } else {
        toast.error(response.data.message || "Failed to validate agent name");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to validate agent name. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
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
          disabled={!agentName || isLoading}
          className="font-[600] flex items-center justify-center gap-2 min-w-[100px] min-h-[40px]"
        >
          {isLoading ? (
            <Spinner className="border-white dark:border-deep-onyx" />
          ) : (
            <span>Continue</span>
          )}
        </PrimaryButton>
      </div>
    </div>
  );
}
