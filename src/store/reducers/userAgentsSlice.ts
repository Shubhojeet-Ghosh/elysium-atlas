import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Agent, UserAgentsState } from "../types/UserAgentsTypes";

const initialState: UserAgentsState = {
  myAgents: [],
  trigger_fetch_agents: 0,
};

const userAgentsSlice = createSlice({
  name: "userAgents",
  initialState,
  reducers: {
    setMyAgents: (state, action: PayloadAction<Agent[]>) => {
      state.myAgents = action.payload;
    },
    addAgent: (state, action: PayloadAction<Agent>) => {
      state.myAgents.push(action.payload);
    },
    removeAgent: (state, action: PayloadAction<string>) => {
      state.myAgents = state.myAgents.filter(
        (agent) => agent.id !== action.payload,
      );
    },
    updateAgent: (state, action: PayloadAction<Agent>) => {
      const idx = state.myAgents.findIndex(
        (agent) => agent.id === action.payload.id,
      );
      if (idx !== -1) {
        state.myAgents[idx] = action.payload;
      }
    },
    resetMyAgents: (state) => {
      state.myAgents = [];
    },
    updateVisitorCounts: (
      state,
      action: PayloadAction<Record<string, number>>,
    ) => {
      state.myAgents = state.myAgents.map((agent: any) => {
        const agentId = agent.agent_id;
        if (
          agentId &&
          Object.prototype.hasOwnProperty.call(action.payload, agentId)
        ) {
          return { ...agent, live_visitors: action.payload[agentId] };
        }
        return agent;
      });
    },
    triggerFetchAgents: (state) => {
      state.trigger_fetch_agents += 1;
    },
  },
});

export const {
  setMyAgents,
  addAgent,
  removeAgent,
  updateAgent,
  resetMyAgents,
  updateVisitorCounts,
  triggerFetchAgents,
} = userAgentsSlice.actions;

export const userAgentsReducer = userAgentsSlice.reducer;
