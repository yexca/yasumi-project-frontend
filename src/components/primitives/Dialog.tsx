import * as RadixDialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

import styles from "./Dialog.module.css";

type DialogProps = {
  children: ReactNode;
  description?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
};

export function Dialog({ children, description, onOpenChange, open, title }: DialogProps) {
  return (
    <RadixDialog.Root onOpenChange={onOpenChange} open={open}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={styles.overlay} />
        <RadixDialog.Content className={styles.content}>
          <div className={styles.header}>
            <RadixDialog.Title className={styles.title}>{title}</RadixDialog.Title>
            {description ? (
              <RadixDialog.Description className={styles.description}>
                {description}
              </RadixDialog.Description>
            ) : null}
          </div>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;
