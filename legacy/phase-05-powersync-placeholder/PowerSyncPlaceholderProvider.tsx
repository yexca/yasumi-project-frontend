import { createContext, useContext, type PropsWithChildren } from "react";

export type PowerSyncPlaceholderState = {
  status: "disconnected";
  labelKey: "sync.placeholderDisconnected";
};

const placeholderState: PowerSyncPlaceholderState = {
  status: "disconnected",
  labelKey: "sync.placeholderDisconnected",
};

const PowerSyncPlaceholderContext = createContext<PowerSyncPlaceholderState>(placeholderState);

export function PowerSyncPlaceholderProvider({ children }: PropsWithChildren) {
  return (
    <PowerSyncPlaceholderContext.Provider value={placeholderState}>
      {children}
    </PowerSyncPlaceholderContext.Provider>
  );
}

export function usePowerSyncPlaceholder() {
  return useContext(PowerSyncPlaceholderContext);
}
