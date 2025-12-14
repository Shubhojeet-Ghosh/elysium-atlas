"use client";
import { forwardRef } from "react";

interface CustomTextareaPrimaryProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  inputClassName?: string;
}

const CustomTextareaPrimary = forwardRef<
  HTMLTextAreaElement,
  CustomTextareaPrimaryProps
>(
  (
    {
      id,
      placeholder = "",
      value,
      onChange,
      className = "",
      inputClassName = "",
      ...props
    },
    ref
  ) => (
    <textarea
      ref={ref}
      id={id}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`border-gray-300 dark:border-deep-onyx font-[600] border-[2px] rounded-[10px] px-[12px] py-[12px]
        placeholder-gray-400 focus:outline-none focus:border-serene-purple dark:focus:border-serene-purple
        transition duration-300 ease-in-out block w-full text-[12px] bg-white dark:bg-deep-onyx  
        ${inputClassName} ${className}
      `}
      {...props}
    />
  )
);

CustomTextareaPrimary.displayName = "CustomTextareaPrimary";
export default CustomTextareaPrimary;
