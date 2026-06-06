"use client";

import { useAppSelector } from "@/store";
import EmailLogout from "@/components/ElysiumAtlas/email/EmailLogout";

interface EmailDropdownProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function EmailDropdown({
  open,
  onOpenChange,
}: EmailDropdownProps) {
  const name = useAppSelector((state) => state.emailUser.name);
  const userEmail = useAppSelector((state) => state.emailUser.email);
  const departmentName = useAppSelector(
    (state) => state.emailUser.departmentName,
  );
  const role = useAppSelector((state) => state.emailUser.role);

  if (!open) return null;

  const roleLabel = role
    ? role.charAt(0).toUpperCase() + role.slice(1)
    : "—";

  return (
    <div className="absolute right-0 top-full mt-1 w-64 bg-pure-mist dark:bg-deep-onyx border border-gray-200 dark:border-serene-purple rounded-md shadow-lg z-50">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-serene-purple">
        <div className="font-semibold text-deep-onyx dark:text-pure-mist text-[14px]">
          {name || "User"}
        </div>
        <div className="text-gray-600 dark:text-gray-400 text-[12px] mt-0.5">
          {userEmail || "No email provided"}
        </div>

        <div className="mt-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className="text-gray-500 dark:text-gray-400">Department</span>
            <span className="text-deep-onyx dark:text-pure-mist font-medium text-right">
              {departmentName || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className="text-gray-500 dark:text-gray-400">Role</span>
            <span className="text-deep-onyx dark:text-pure-mist font-medium text-right capitalize">
              {roleLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="px-2 py-2">
        <EmailLogout onClick={() => onOpenChange?.(false)} />
      </div>
    </div>
  );
}
