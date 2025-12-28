import CustomTextareaPrimary from "@/components/inputs/CustomTextareaPrimary";
import InfoIcon from "@/components/ui/InfoIcon";
import { useAppSelector, useAppDispatch } from "@/store";
import { setWelcomeMessage } from "@/store/reducers/agentSlice";

export default function WelcomeMessage() {
  const welcomeMessage = useAppSelector((state) => state.agent.welcomeMessage);
  const dispatch = useAppDispatch();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <label className="text-[14px] font-[600] text-deep-onyx dark:text-pure-mist">
          Welcome Message
        </label>
        <InfoIcon text="The welcome message is displayed when users first interact with the agent." />
      </div>
      <CustomTextareaPrimary
        placeholder="Enter your welcome message here..."
        value={welcomeMessage}
        onChange={(e) => dispatch(setWelcomeMessage(e.target.value))}
        rows={6}
      />
    </div>
  );
}
