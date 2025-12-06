"use client";

import React, { forwardRef } from "react";

export interface CustomTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  wrapperClassName?: string; // applied to the outer container
  textareaClassName?: string; // applied to the actual textarea
}

/**
 * CustomTextareaPrimaryCyan
 * - wrapper handles the has-[textarea:focus-within]:border-primarycyan behavior
 * - accepts wrapperClassName and textareaClassName for parent-level overrides
 */
const CustomTextareaPrimaryCyan = forwardRef<
  HTMLTextAreaElement,
  CustomTextareaProps
>(
  (
    { wrapperClassName = "", textareaClassName = "", className = "", ...props },
    ref
  ) => {
    return (
      <div
        className={`rounded-[12px] border-[2px] border-gray-300 dark:border-gray-700
                    has-[textarea:focus-within]:border-primarycyan transition-all duration-300 ease-in-out
                    ${wrapperClassName}`}
      >
        <textarea
          ref={ref}
          {...props}
          className={`w-full bg-transparent px-3 py-[12px] text-[14px] font-[500] text-gray-800 dark:text-gray-200
                     placeholder:text-gray-400 focus:outline-none resize-none ${textareaClassName} ${className}`}
        />
      </div>
    );
  }
);

CustomTextareaPrimaryCyan.displayName = "CustomTextareaPrimaryCyan";
export default CustomTextareaPrimaryCyan;
