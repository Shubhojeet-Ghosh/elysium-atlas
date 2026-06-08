"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

function parseEmailAddress(raw: string): { name: string; email: string } {
  const match = raw.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim().replace(/^"|"$/g, ""), email: match[2].trim() };
  }
  return { name: raw.trim(), email: raw.trim() };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getChipLabel(entry: string): string {
  const { name, email } = parseEmailAddress(entry);
  if (name && email && name !== email) {
    return name;
  }
  return email || name;
}

interface EmailRecipientChipInputProps {
  id: string;
  label: string;
  emails: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
}

export default function EmailRecipientChipInput({
  id,
  label,
  emails,
  onChange,
  placeholder = "Add email and press Enter",
}: EmailRecipientChipInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [inputError, setInputError] = useState(false);

  const commitEmail = (rawValue: string) => {
    const trimmed = rawValue.trim();
    if (!trimmed) {
      return;
    }

    const { email } = parseEmailAddress(trimmed);
    if (!isValidEmail(email)) {
      setInputError(true);
      return;
    }

    const normalized = normalizeEmail(email);
    const isDuplicate = emails.some(
      (entry) => normalizeEmail(parseEmailAddress(entry).email) === normalized,
    );

    if (!isDuplicate) {
      onChange([...emails, email]);
    }

    setInputValue("");
    setInputError(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitEmail(inputValue);
      return;
    }

    if (event.key === "Backspace" && !inputValue && emails.length > 0) {
      onChange(emails.slice(0, -1));
      setInputError(false);
    }
  };

  const removeEmail = (index: number) => {
    onChange(emails.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <div className="flex items-start gap-1">
      <label
        htmlFor={id}
        className="shrink-0 pt-0.5 font-medium text-gray-600"
      >
        {label}
      </label>
      <div className="min-w-0 flex-1">
        <div
          className={`flex min-h-[28px] flex-wrap items-center gap-1.5 rounded-md px-0.5 py-0.5 ${
            inputError ? "ring-1 ring-red-300" : ""
          }`}
        >
          {emails.map((entry, index) => (
            <span
              key={`${entry}-${index}`}
              className="inline-flex max-w-full items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[12px] text-gray-700"
            >
              <span className="truncate" title={entry}>
                {getChipLabel(entry)}
              </span>
              <button
                type="button"
                onClick={() => removeEmail(index)}
                aria-label={`Remove ${getChipLabel(entry)}`}
                className="inline-flex shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:text-gray-800 cursor-pointer"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            id={id}
            type="text"
            value={inputValue}
            onChange={(event) => {
              setInputValue(event.target.value);
              if (inputError) {
                setInputError(false);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={emails.length === 0 ? placeholder : ""}
            className="min-w-[120px] flex-1 bg-transparent text-[12px] text-gray-700 placeholder:text-gray-400 focus:outline-none"
          />
        </div>
        {inputError && (
          <p className="mt-0.5 text-[11px] text-red-500">
            Enter a valid email address.
          </p>
        )}
      </div>
    </div>
  );
}
