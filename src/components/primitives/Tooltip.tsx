import * as RadixTooltip from "@radix-ui/react-tooltip";
import { useEffect, useState, type ReactNode } from "react";

import styles from "./Tooltip.module.css";

type TooltipProps = {
  children: ReactNode;
  content: string;
};

export function Tooltip({ children, content }: TooltipProps) {
  const [disabled, setDisabled] = useState(() => shouldDisableTooltip());

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const pointerQuery = window.matchMedia("(pointer: coarse)");
    const widthQuery = window.matchMedia("(max-width: 760px)");

    function syncDisabled() {
      setDisabled(pointerQuery.matches || widthQuery.matches);
    }

    syncDisabled();
    pointerQuery.addEventListener("change", syncDisabled);
    widthQuery.addEventListener("change", syncDisabled);
    return () => {
      pointerQuery.removeEventListener("change", syncDisabled);
      widthQuery.removeEventListener("change", syncDisabled);
    };
  }, []);

  if (disabled) {
    return children;
  }

  return (
    <RadixTooltip.Provider delayDuration={250}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content className={styles.content} sideOffset={6}>
            {content}
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}

function shouldDisableTooltip() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(max-width: 760px)").matches;
}
