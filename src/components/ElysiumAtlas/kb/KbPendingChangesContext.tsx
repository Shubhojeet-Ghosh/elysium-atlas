"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export interface KbPendingRegistration {
  hasPending: () => boolean;
  getPendingCount?: () => number;
  onIndex: () => Promise<void>;
  onClear: () => void;
}

interface KbPendingChangesContextValue {
  register: (id: string, registration: KbPendingRegistration) => void;
  unregister: (id: string) => void;
  notifyChange: () => void;
  getSnapshot: () => { hasPending: boolean; pendingCount: number };
  runIndexAll: () => Promise<void>;
  runClearAll: () => void;
  version: number;
}

const KbPendingChangesContext =
  createContext<KbPendingChangesContextValue | null>(null);

export function KbPendingChangesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const registrationsRef = useRef<Map<string, KbPendingRegistration>>(
    new Map(),
  );
  const [version, setVersion] = useState(0);

  const getSnapshot = useCallback(() => {
    let pendingCount = 0;
    let hasPending = false;

    for (const registration of registrationsRef.current.values()) {
      if (registration.hasPending()) {
        hasPending = true;
        pendingCount += registration.getPendingCount?.() ?? 1;
      }
    }

    return { hasPending, pendingCount };
  }, []);

  const register = useCallback(
    (id: string, registration: KbPendingRegistration) => {
      registrationsRef.current.set(id, registration);
      setVersion((v) => v + 1);
    },
    [],
  );

  const unregister = useCallback((id: string) => {
    registrationsRef.current.delete(id);
    setVersion((v) => v + 1);
  }, []);

  const notifyChange = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  const runIndexAll = useCallback(async () => {
    for (const registration of registrationsRef.current.values()) {
      if (registration.hasPending()) {
        await registration.onIndex();
      }
    }
    setVersion((v) => v + 1);
  }, []);

  const runClearAll = useCallback(() => {
    for (const registration of registrationsRef.current.values()) {
      if (registration.hasPending()) {
        registration.onClear();
      }
    }
    setVersion((v) => v + 1);
  }, []);

  const value = useMemo(
    () => ({
      register,
      unregister,
      notifyChange,
      getSnapshot,
      runIndexAll,
      runClearAll,
      version,
    }),
    [
      register,
      unregister,
      notifyChange,
      getSnapshot,
      runIndexAll,
      runClearAll,
      version,
    ],
  );

  return (
    <KbPendingChangesContext.Provider value={value}>
      {children}
    </KbPendingChangesContext.Provider>
  );
}

export function useKbPendingChangesContext() {
  const context = useContext(KbPendingChangesContext);
  if (!context) {
    throw new Error(
      "useKbPendingChangesContext must be used within KbPendingChangesProvider",
    );
  }
  return context;
}

export function useKbPendingRegistration(
  id: string,
  registration: KbPendingRegistration,
  deps: unknown[],
) {
  const { register, unregister, notifyChange } = useKbPendingChangesContext();
  const registrationRef = useRef(registration);
  registrationRef.current = registration;

  useEffect(() => {
    register(id, {
      hasPending: () => registrationRef.current.hasPending(),
      getPendingCount: () => registrationRef.current.getPendingCount?.() ?? 0,
      onIndex: () => registrationRef.current.onIndex(),
      onClear: () => registrationRef.current.onClear(),
    });
    return () => unregister(id);
  }, [id, register, unregister, ...deps]);

  return notifyChange;
}

export function useKbPendingSnapshot() {
  const context = useContext(KbPendingChangesContext);
  if (!context) {
    return {
      hasPending: false,
      pendingCount: 0,
      version: 0,
      runIndexAll: async () => {},
      runClearAll: () => {},
    };
  }

  const { hasPending, pendingCount } = context.getSnapshot();

  return {
    hasPending,
    pendingCount,
    version: context.version,
    runIndexAll: context.runIndexAll,
    runClearAll: context.runClearAll,
  };
}
