"use client";

import { forwardRef } from "react";
import clsx from "clsx"; // optional helper for merging classNames

interface TransparentInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}

const TransparentInput = forwardRef<HTMLInputElement, TransparentInputProps>(
  ({ value, onChange, onBlur, onKeyDown, placeholder, className }, ref) => (
    <input
      ref={ref}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={clsx(
        "bg-transparent border-b border-white/60 text-white text-sm focus:outline-none focus:border-white/90 px-1",
        className
      )}
    />
  )
);

TransparentInput.displayName = "TransparentInput";
export default TransparentInput;
