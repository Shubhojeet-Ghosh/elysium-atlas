"use client";

import { useAppSelector, useAppDispatch } from "@/store";
import { useEffect } from "react";
import ChatHeader from "./ChatHeader";
import MainChatSpace from "./MainChatSpace";
import ChatFooter from "./ChatFooter";
import fastApiAxios from "@/utils/fastapi_axios";
import { store } from "@/store";
import {
  setAgentFields,
  setIsFetching,
  setConversationChain,
  addMessage,
} from "@/store/reducers/agentChatSlice";

export default function AgentChatSpace() {
  const { agent_id, chat_session_id } = useAppSelector(
    (state) => state.agentChat
  );

  const dispatch = useAppDispatch();

  useEffect(() => {
    const fetchData = async () => {
      dispatch(setIsFetching(true));
      try {
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
          chat_session_id: chat_session_id,
          source: "web",
        };

        const response = await fastApiAxios.post(
          "/elysium-agents/elysium-atlas/agent/v1/get-agent-fields",
          payload
        );

        const agentData = response.data;

        if (agentData.success === true) {
          const agentFields = agentData.agent_fields || {};
          const chat_session_data = agentData.chat_session_data || {};

          store.dispatch(
            setAgentFields({
              agent_name:
                chat_session_data.agent_name || agentFields.agent_name || "",
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

          if (chat_session_data && chat_session_data.conversation_chain) {
            store.dispatch(
              setConversationChain(chat_session_data.conversation_chain)
            );
          } else {
            const welcomeMessage = agentFields.welcome_message || "";
            if (welcomeMessage) {
              store.dispatch(
                addMessage({
                  message_id: crypto.randomUUID(),
                  role: "agent",
                  content: welcomeMessage,
                  created_at: new Date().toISOString(),
                })
              );
            }
          }
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
