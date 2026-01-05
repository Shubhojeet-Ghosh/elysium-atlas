import { Pause } from "lucide-react";
import { useAppSelector } from "../../store";

export default function AgentProgressCard() {
  const agentCurrentTask = useAppSelector(
    (state) => state.agent.agent_current_task
  );
  const progress = useAppSelector((state) => state.agent.progress);

  // Calculate the circumference and stroke-dasharray for the circular progress
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="max-w-[340px] w-full bg-gradient-to-br from-serene-purple/50 to-serene-purple/30 rounded-[20px] px-[24px] py-[20px] shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-3 mb-4">
        <div className="rounded-full p-[12px] bg-gradient-to-br from-pure-mist to-white flex items-center justify-center shadow-sm">
          <Pause className="text-serene-purple" size={18} />
        </div>

        <div className="flex-1">
          <p className="text-[17px] font-[700] text-deep-onyx dark:text-pure-mist mb-1">
            Agent is being updated.
          </p>
          <p className="text-[13px] font-[500] text-deep-onyx dark:text-pure-mist leading-relaxed mb-3">
            {agentCurrentTask || "Setting up your AI agent..."}
          </p>

          {/* Circular Progress Indicator */}
          <div className="flex items-center gap-3">
            <div className="relative w-20 h-20">
              <svg
                className="w-20 h-20 transform -rotate-90"
                viewBox="0 0 100 100"
              >
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-200 dark:text-gray-700"
                />
                {/* Progress circle */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="text-serene-purple transition-all duration-300 ease-in-out"
                  strokeLinecap="round"
                />
              </svg>
              {/* Progress text in center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[14px] font-[700] text-serene-purple">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>

            <div className="flex-1">
              <p className="text-[12px] text-gray-600 dark:text-gray-400">
                Please wait while we prepare your agent...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
