"use client";

import { useAppSelector, useAppDispatch } from "@/store";
import { useEffect } from "react";
import ChatHeader from "./ChatHeader";
import MainChatSpace from "./MainChatSpace";
import ChatFooter from "./ChatFooter";
import fastApiAxios from "@/utils/fastapi_axios";
import Cookies from "js-cookie";
import { store } from "@/store";
import { setAgentFields, setIsFetching } from "@/store/reducers/agentChatSlice";

export default function AgentChatSpace() {
  const { agent_id, chat_session_id } = useAppSelector(
    (state) => state.agentChat
  );

  const dispatch = useAppDispatch();

  useEffect(() => {
    const fetchData = async () => {
      dispatch(setIsFetching(true));
      try {
        const sessionToken = Cookies.get("elysium_atlas_session_token");

        const payload = {
          agent_id: agent_id,
          fields: [
            "agent_name",
            "agent_icon",
            "welcome_message",
            "placeholder_text",
            "primary_color",
            "secondary_color",
            "text_color",
            "quick_prompts",
            "agent_status",
          ],
        };

        const response = await fastApiAxios.post(
          "/elysium-agents/elysium-atlas/agent/v1/get-agent-fields",
          payload
        );

        const agentData = response.data;

        if (agentData.success === true) {
          const agentFields = agentData.agent_fields || {};

          store.dispatch(
            setAgentFields({
              agent_name: agentFields.agent_name || "",
              agent_icon: agentFields.agent_icon || null,
              welcome_message: agentFields.welcome_message || "",
              placeholder_text: agentFields.placeholder_text || "",
              primary_color: agentFields.primary_color || "",
              secondary_color: agentFields.secondary_color || "",
              text_color: agentFields.text_color || "",
              quick_prompts: agentFields.quick_prompts || [],
              agent_status: agentFields.agent_status || "",
            })
          );
        } else {
          console.warn("API response indicates failure:", agentData);
        }
      } catch (error) {
        console.error("Error fetching agent fields:", error);
      } finally {
        dispatch(setIsFetching(false));
      }
    };

    if (agent_id) {
      fetchData();
    }
  }, [agent_id, dispatch]);

  return (
    <>
      <div className="h-[100dvh] w-full flex items-center justify-center bg-indigo-50">
        <div className="lg:w-[440px] lg:h-[580px] md:w-full md:h-[100dvh] w-full h-[100dvh] shadow-lg rounded-[16px] bg-white">
          <div className="flex flex-col h-full w-full">
            <ChatHeader />
            <MainChatSpace />
            <ChatFooter />
          </div>
        </div>
      </div>
    </>
  );
}
