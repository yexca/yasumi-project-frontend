import * as RadixDialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

import styles from "./Dialog.module.css";

type DialogProps = {
  children: ReactNode;
  className?: string;
  description?: string;
  hideHeader?: boolean;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
};

export function Dialog({
  children,
  className,
  description,
  hideHeader = false,
  onOpenChange,
  open,
  title,
}: DialogProps) {
  return (
    <RadixDialog.Root onOpenChange={onOpenChange} open={open}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={styles.overlay} />
        <RadixDialog.Content
          className={[styles.content, className ?? ""].filter(Boolean).join(" ")}
        >
          {hideHeader ? (
            <>
              <RadixDialog.Title className="visually-hidden">{title}</RadixDialog.Title>
              {description ? (
                <RadixDialog.Description className="visually-hidden">
                  {description}
                </RadixDialog.Description>
              ) : null}
            </>
          ) : (
            <div className={styles.header}>
              <RadixDialog.Title className={styles.title}>{title}</RadixDialog.Title>
              {description ? (
                <RadixDialog.Description className={styles.description}>
                  {description}
                </RadixDialog.Description>
              ) : null}
            </div>
          )}
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export const DialogTrigger = RadixDialog.Trigger;
export const DialogClose = RadixDialog.Close;
