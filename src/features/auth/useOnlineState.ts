import { useEffect, useState } from "react";

export function getOnlineState(): boolean {
  return typeof navigator === "undefined" || !("onLine" in navigator) ? true : navigator.onLine;
}

export function useOnlineState(): boolean {
  const [isOffline, setIsOffline] = useState(() => getOnlineState() === false);

  useEffect(() => {
    function handleOnlineState() {
      setIsOffline(getOnlineState() === false);
    }

    window.addEventListener("online", handleOnlineState);
    window.addEventListener("offline", handleOnlineState);
    handleOnlineState();

    return () => {
      window.removeEventListener("online", handleOnlineState);
      window.removeEventListener("offline", handleOnlineState);
    };
  }, []);

  return isOffline;
}
