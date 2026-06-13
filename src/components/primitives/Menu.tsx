import * as RadixMenu from "@radix-ui/react-dropdown-menu";
import type { ReactNode } from "react";

import styles from "./Menu.module.css";

type MenuProps = {
  children: ReactNode;
  trigger: ReactNode;
};

export function Menu({ children, trigger }: MenuProps) {
  return (
    <RadixMenu.Root>
      <RadixMenu.Trigger asChild>{trigger}</RadixMenu.Trigger>
      <RadixMenu.Portal>
        <RadixMenu.Content align="end" className={styles.content} sideOffset={6}>
          {children}
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  );
}

export function MenuItem({ children, onSelect }: { children: ReactNode; onSelect?: () => void }) {
  return (
    <RadixMenu.Item className={styles.item} onSelect={onSelect}>
      {children}
    </RadixMenu.Item>
  );
}

export function MenuSeparator() {
  return <RadixMenu.Separator className={styles.separator} />;
}
