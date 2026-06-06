"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import CustomInput from "@/components/inputs/CustomInput";
import AutoComplete from "@/components/ui/AutoComplete";
import { toast } from "sonner";
import Spinner from "@/components/ui/Spinner";
import { registerEmailUser } from "@/utils/emailAuthApi";
import { listTeamDepartments } from "@/utils/emailDepartmentsApi";
import {
  EMAIL_USER_ROLES,
  type EmailUserRole,
} from "@/store/types/EmailUserTypes";

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function formatRoleLabel(role: EmailUserRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export default function EmailRegisterUserBox() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teamId, setTeamId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [role, setRole] = useState<EmailUserRole | "">("");
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState<
    { value: string; label: string; selectedLabel: string }[]
  >([]);

  const roleItems = useMemo(
    () =>
      EMAIL_USER_ROLES.map((item) => ({
        value: item,
        label: formatRoleLabel(item),
        selectedLabel: formatRoleLabel(item),
      })),
    [],
  );

  const fetchDepartmentsForTeam = useCallback(async (team: string) => {
    const trimmedTeamId = team.trim();
    if (!trimmedTeamId) {
      setDepartmentOptions([]);
      setDepartmentId("");
      return;
    }

    setIsLoadingDepartments(true);
    try {
      const data = await listTeamDepartments(trimmedTeamId);
      if (data.success && Array.isArray(data.departments)) {
        setDepartmentOptions(
          data.departments.map((department) => ({
            value: department.department_id,
            label: department.department_description
              ? `${department.department_name} — ${department.department_description}`
              : department.department_name,
            selectedLabel: department.department_name,
          })),
        );
      } else {
        setDepartmentOptions([]);
      }
    } catch {
      setDepartmentOptions([]);
      toast.error("Failed to load departments for this team.", {
        position: "top-center",
      });
    } finally {
      setIsLoadingDepartments(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchDepartmentsForTeam(teamId);
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [teamId, fetchDepartmentsForTeam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a name.", { position: "top-center" });
      return;
    }

    if (!email.trim()) {
      toast.error("Please enter an email.", { position: "top-center" });
      return;
    }

    if (!password) {
      toast.error("Please enter a password.", { position: "top-center" });
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.", {
        position: "top-center",
      });
      return;
    }

    if (!teamId.trim()) {
      toast.error("Please enter a team ID.", { position: "top-center" });
      return;
    }

    if (!departmentId) {
      toast.error("Please select a department.", { position: "top-center" });
      return;
    }

    if (!role) {
      toast.error("Please select a role.", { position: "top-center" });
      return;
    }

    setIsLoading(true);
    try {
      const data = await registerEmailUser({
        name: name.trim(),
        email: email.trim(),
        password,
        team_id: teamId.trim(),
        department_id: departmentId,
        role,
      });

      if (data.success) {
        toast.success(data.message || "User registered successfully.", {
          position: "top-center",
        });

        setTimeout(() => {
          window.location.href = "/email/auth/login";
        }, 150);
      } else {
        toast.error(data.message || "Registration failed.", {
          position: "top-center",
        });
      }
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(error, "Failed to register user. Please try again."),
        { position: "top-center" },
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center justify-center h-full w-full"
    >
      <div className="flex flex-col p-6 md:w-[440px] w-full">
        <p className="text-[20px] font-bold text-deep-onyx dark:text-pure-mist text-center">
          Register User
        </p>
        <p className="text-[14px] text-gray600 text-center dark:text-gray500 mb-2">
          Create an email agent account for your team...
        </p>

        <div className="flex flex-col mt-[25px] gap-3">
          <div className="flex flex-col">
            <p className="text-[14px] font-[500] ml-[2px] text-gray600 dark:text-pure-mist">
              Name
            </p>
            <CustomInput
              id="name"
              autoComplete="name"
              type="text"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-[2px] min-h-[40px]"
            />
          </div>

          <div className="flex flex-col">
            <p className="text-[14px] font-[500] ml-[2px] text-gray600 dark:text-pure-mist">
              Email
            </p>
            <CustomInput
              id="email"
              autoComplete="email"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-[2px] min-h-[40px]"
            />
          </div>

          <div className="flex flex-col">
            <p className="text-[14px] font-[500] ml-[2px] text-gray600 dark:text-pure-mist">
              Password
            </p>
            <CustomInput
              id="password"
              autoComplete="new-password"
              type={showPwd ? "text" : "password"}
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-[2px] min-h-[40px]"
            />
            <label className="flex items-center gap-2 mt-2 text-[13px] text-gray-600 dark:text-pure-mist select-none cursor-pointer">
              <input
                type="checkbox"
                checked={showPwd}
                onChange={() => setShowPwd((prev) => !prev)}
                className="accent-deep-onyx"
              />
              Show password
            </label>
          </div>

          <div className="flex flex-col">
            <p className="text-[14px] font-[500] ml-[2px] text-gray600 dark:text-pure-mist">
              Team ID
            </p>
            <CustomInput
              id="team_id"
              type="text"
              placeholder="callbotics"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="mt-[2px] min-h-[40px]"
            />
          </div>

          <div className="flex flex-col">
            <p className="text-[14px] font-[500] ml-[2px] text-gray600 dark:text-pure-mist">
              Department
            </p>
            {isLoadingDepartments ? (
              <div className="flex items-center justify-center min-h-[40px] mt-[2px]">
                <Spinner className="border-gray-700" />
              </div>
            ) : !teamId.trim() ? (
              <p className="text-[12px] text-gray-500 mt-[2px]">
                Enter a team ID to load departments.
              </p>
            ) : departmentOptions.length === 0 ? (
              <p className="text-[12px] text-gray-500 mt-[2px]">
                No departments found for this team.
              </p>
            ) : (
              <AutoComplete
                items={departmentOptions}
                value={departmentId}
                placeholder="Select a department..."
                searchPlaceholder="Search department..."
                emptyMessage="No department found."
                onChange={(value) => setDepartmentId(value)}
                className="text-[13px] font-[500] mt-[2px]"
              />
            )}
          </div>

          <div className="flex flex-col">
            <p className="text-[14px] font-[500] ml-[2px] text-gray600 dark:text-pure-mist">
              Role
            </p>
            <AutoComplete
              items={roleItems}
              value={role}
              placeholder="Select a role..."
              searchPlaceholder="Search role..."
              emptyMessage="No role found."
              onChange={(value) => setRole(value as EmailUserRole)}
              className="text-[13px] font-[500] mt-[2px]"
            />
          </div>

          <button
            type="submit"
            disabled={
              isLoading ||
              isLoadingDepartments ||
              !name.trim() ||
              !email.trim() ||
              !password ||
              !teamId.trim() ||
              !departmentId ||
              !role
            }
            className="min-h-[40px] w-full mt-[8px] py-2 rounded-[10px] bg-serene-purple text-white text-[12px] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Spinner className="border-white dark:border-deep-onyx" />
            ) : (
              <span className="text-[12px]">Register user</span>
            )}
          </button>

          <p className="text-center text-[13px] text-gray-600 dark:text-gray-400 mt-2">
            Need to create a department first?{" "}
            <Link
              href="/email/auth/register-department"
              className="text-serene-purple hover:underline font-medium"
            >
              Register department
            </Link>
          </p>

          <p className="text-center text-[13px] text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              href="/email/auth/login"
              className="text-serene-purple hover:underline font-medium"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </form>
  );
}
