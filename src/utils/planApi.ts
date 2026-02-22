import { AppDispatch } from "@/store";
import {
  setPlan,
  setOriginalLimits,
  setAvailableLimits,
} from "@/store/reducers/userPlanSlice";
import nodeExpressAxios from "@/utils/node_express_apis";

const getTokenFromCookie = (name: string): string | null => {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? match.split("=")[1] : null;
};

export const fetchUserPlan = async (dispatch: AppDispatch): Promise<void> => {
  const token = getTokenFromCookie("elysium_atlas_session_token");

  if (!token) return;

  const response = await nodeExpressAxios.post(
    "/elysium-atlas/v1/plan/info",
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const { success, plan_data } = response.data;

  if (success && plan_data) {
    dispatch(setPlan(plan_data.plan));
    dispatch(setOriginalLimits(plan_data.original_limits));
    dispatch(setAvailableLimits(plan_data.available_limits));
  }
};
