"use client";

import { createContext, useContext } from "react";

export type KbDatasourceMode = "edit" | "build";

const KbDatasourceModeContext = createContext<KbDatasourceMode>("edit");

export function KbDatasourceModeProvider({
  mode,
  children,
}: {
  mode: KbDatasourceMode;
  children: React.ReactNode;
}) {
  return (
    <KbDatasourceModeContext.Provider value={mode}>
      {children}
    </KbDatasourceModeContext.Provider>
  );
}

export function useKbDatasourceMode(): KbDatasourceMode {
  return useContext(KbDatasourceModeContext);
}

export function useIsKbBuildFlow(): boolean {
  return useKbDatasourceMode() === "build";
}
