export type DashboardDateRange =
  | "today"
  | "last_7_days"
  | "last_30_days"
  | "last_365_days";

export type DashboardGranularity = "day" | "month";

export interface ChatSessionCountsRequest {
  range: DashboardDateRange;
  agent_id?: string;
}

export interface ChatSessionCountPoint {
  date: string;
  count: number;
  visitor_message_count: number;
}

export interface ChatSessionCountsResponse {
  success: true;
  range: DashboardDateRange;
  timezone: "UTC";
  granularity: DashboardGranularity;
  agent_id: string | null;
  start_at: string;
  end_at: string;
  total: number;
  total_visitor_messages: number;
  points: ChatSessionCountPoint[];
}
