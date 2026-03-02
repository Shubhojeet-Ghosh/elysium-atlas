import SessionRow from "./SessionRow";

interface PanelBodyProps {
  sessions: { chat_session_id: string }[];
}

export default function PanelBody({ sessions }: PanelBodyProps) {
  return (
    <div className="bg-white dark:bg-[#1b1b1b] max-h-[360px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
      {sessions.map((session) => (
        <SessionRow
          key={session.chat_session_id}
          chat_session_id={session.chat_session_id}
        />
      ))}
    </div>
  );
}
