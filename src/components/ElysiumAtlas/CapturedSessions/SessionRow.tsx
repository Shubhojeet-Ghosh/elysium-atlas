import SessionAvatar from "./SessionAvatar";

interface SessionRowProps {
  chat_session_id: string;
}

export default function SessionRow({ chat_session_id }: SessionRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
      <SessionAvatar />
      <div className="flex flex-col min-w-0">
        <span className="text-[13px] font-[500] text-deep-onyx dark:text-pure-mist truncate">
          {chat_session_id}
        </span>
      </div>
    </div>
  );
}
