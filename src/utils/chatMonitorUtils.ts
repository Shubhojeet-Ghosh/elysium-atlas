import aiSocket from "@/lib/aiSocket";

type MonitorEntry = { agent_id: string };

const activeMonitors = new Map<string, MonitorEntry>();
const pendingMonitorStarts = new Map<string, MonitorEntry>();

let teamMemberConnected = false;

export function setTeamMemberConnected(connected: boolean) {
  teamMemberConnected = connected;
  if (connected) {
    flushPendingMonitorStarts();
  } else {
    pendingMonitorStarts.clear();
  }
}

function flushPendingMonitorStarts() {
  if (!teamMemberConnected) return;

  for (const [chat_session_id, entry] of pendingMonitorStarts) {
    emitStartMonitorConversation(entry.agent_id, chat_session_id);
  }
  pendingMonitorStarts.clear();
}

export function emitStartMonitorConversation(
  agent_id: string,
  chat_session_id: string,
) {
  if (!agent_id || !chat_session_id) return;

  if (activeMonitors.has(chat_session_id)) return;

  if (!teamMemberConnected) {
    pendingMonitorStarts.set(chat_session_id, { agent_id });
    return;
  }

  activeMonitors.set(chat_session_id, { agent_id });
  aiSocket.emit("atlas-team-member-monitor-conversation", {
    agent_id,
    chat_session_id,
  });
}

export function emitStopMonitorConversation(
  agent_id: string,
  chat_session_id: string,
) {
  pendingMonitorStarts.delete(chat_session_id);
  activeMonitors.delete(chat_session_id);
  if (!agent_id || !chat_session_id) return;

  aiSocket.emit("atlas-team-member-stop-monitor-conversation", {
    agent_id,
    chat_session_id,
  });
}

/** Re-register monitor sessions after socket reconnect (server tracks by sid). */
export function rejoinMonitorConversations(
  agent_id: string,
  chat_session_ids: string[],
) {
  if (!agent_id || !teamMemberConnected) return;

  for (const chat_session_id of chat_session_ids) {
    activeMonitors.delete(chat_session_id);
    emitStartMonitorConversation(agent_id, chat_session_id);
  }
}

export function stopAllMonitorConversations() {
  for (const [chat_session_id, entry] of activeMonitors) {
    aiSocket.emit("atlas-team-member-stop-monitor-conversation", {
      agent_id: entry.agent_id,
      chat_session_id,
    });
  }
  activeMonitors.clear();
  pendingMonitorStarts.clear();
}

export function clearMonitorRegistry() {
  activeMonitors.clear();
  pendingMonitorStarts.clear();
  teamMemberConnected = false;
}

export function abandonMonitorSession(chat_session_id: string) {
  activeMonitors.delete(chat_session_id);
  pendingMonitorStarts.delete(chat_session_id);
}
