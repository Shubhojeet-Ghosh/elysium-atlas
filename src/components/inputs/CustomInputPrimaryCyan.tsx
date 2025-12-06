"use client";

import React, { forwardRef } from "react";

export interface CustomInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  wrapperClassName?: string; // applied to the outer container
  inputClassName?: string; // applied to the actual input
}

/**
 * CustomInputPrimaryCyan
 * - wrapper handles the has-[input:focus-within]:border-primarycyan behavior
 * - accepts wrapperClassName and inputClassName for parent-level overrides
 */
const CustomInputPrimaryCyan = forwardRef<HTMLInputElement, CustomInputProps>(
  (
    { wrapperClassName = "", inputClassName = "", className = "", ...props },
    ref
  ) => {
    return (
      <div
        className={`flex items-center rounded-[12px] border-[2px] border-gray-300 dark:border-gray-700
                    bg-transparent px-3 has-[input:focus-within]:border-primarycyan
                    transition-all duration-300 ease-in-out ${wrapperClassName}`}
      >
        <input
          ref={ref}
          {...props}
          className={`w-full bg-transparent py-[12px] text-[14px] font-[500] text-gray-800 dark:text-gray-200
                     placeholder:text-gray-400 focus:outline-none ${inputClassName} ${className}`}
        />
      </div>
    );
  }
);

CustomInputPrimaryCyan.displayName = "CustomInputPrimaryCyan";
export default CustomInputPrimaryCyan;
