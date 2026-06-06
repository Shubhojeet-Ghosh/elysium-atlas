"use client";

import { useState } from "react";
import Link from "next/link";
import CustomInput from "@/components/inputs/CustomInput";
import CustomTextareaPrimary from "@/components/inputs/CustomTextareaPrimary";
import { toast } from "sonner";
import Spinner from "@/components/ui/Spinner";
import { createEmailDepartment } from "@/utils/emailDepartmentsApi";

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

export default function EmailRegisterDepartmentBox() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [teamId, setTeamId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a department name.", {
        position: "top-center",
      });
      return;
    }

    if (!description.trim()) {
      toast.error("Please enter a department description.", {
        position: "top-center",
      });
      return;
    }

    if (!teamId.trim()) {
      toast.error("Please enter a team ID.", { position: "top-center" });
      return;
    }

    setIsLoading(true);
    try {
      const data = await createEmailDepartment(name, description, teamId);

      if (data.success) {
        toast.success(data.message || "Department created successfully.", {
          position: "top-center",
        });

        setName("");
        setDescription("");
        setTeamId("");
      } else {
        toast.error(data.message || "Failed to create department.", {
          position: "top-center",
        });
      }
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(
          error,
          "Failed to create department. Please try again.",
        ),
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
          Register Department
        </p>
        <p className="text-[14px] text-gray600 text-center dark:text-gray500 mb-2">
          Create a department for your team...
        </p>

        <div className="flex flex-col mt-[25px] gap-3">
          <div className="flex flex-col">
            <p className="text-[14px] font-[500] ml-[2px] text-gray600 dark:text-pure-mist">
              Department Name
            </p>
            <CustomInput
              id="department_name"
              type="text"
              placeholder="Billing and Invoices"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-[2px] min-h-[40px]"
            />
          </div>

          <div className="flex flex-col">
            <p className="text-[14px] font-[500] ml-[2px] text-gray600 dark:text-pure-mist">
              Description
            </p>
            <CustomTextareaPrimary
              id="department_description"
              placeholder="Department which handles Billing and Invoices."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-[2px] min-h-[96px] resize-y"
            />
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

          <button
            type="submit"
            disabled={
              isLoading || !name.trim() || !description.trim() || !teamId.trim()
            }
            className="min-h-[40px] w-full mt-[8px] py-2 rounded-[10px] bg-serene-purple text-white text-[12px] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Spinner className="border-white dark:border-deep-onyx" />
            ) : (
              <span className="text-[12px]">Create department</span>
            )}
          </button>

          <p className="text-center text-[13px] text-gray-600 dark:text-gray-400 mt-2">
            Need to register a user?{" "}
            <Link
              href="/email/auth/register-user"
              className="text-serene-purple hover:underline font-medium"
            >
              Register user
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
