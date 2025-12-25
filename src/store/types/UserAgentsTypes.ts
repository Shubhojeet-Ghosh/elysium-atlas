export interface Agent {
  id: string;
  name: string;
  status: string;
  created: string;
}

export interface UserAgentsState {
  myAgents: Agent[];
  trigger_fetch_agents: number;
}
