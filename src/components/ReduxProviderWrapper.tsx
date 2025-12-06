"use client";

import dynamic from "next/dynamic";

const ReduxProvider = dynamic(() => import("@/store/redux-provider"), {
  ssr: false,
});

interface ReduxProviderWrapperProps {
  children: React.ReactNode;
}

export default function ReduxProviderWrapper({
  children,
}: ReduxProviderWrapperProps) {
  return <ReduxProvider>{children}</ReduxProvider>;
}

