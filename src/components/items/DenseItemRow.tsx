import { CheckCircle2, Circle, MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";

import { IconButton } from "@/components/primitives/Button";

import styles from "./DenseItemRow.module.css";

export type DenseItemRowState =
  | "normal"
  | "recommended"
  | "completed"
  | "held"
  | "archived"
  | "pending"
  | "rejected";

type DenseItemRowProps = {
  actions?: ReactNode;
  area?: string;
  date?: string;
  leading?: ReactNode;
  moreActionLabel: string;
  onPrimaryAction?: () => void;
  primaryActionLabel: string;
  primaryIcon?: ReactNode;
  reasons?: string[];
  state?: DenseItemRowState;
  stateLabel?: string;
  title: string;
};

export function DenseItemRow({
  actions,
  area,
  date,
  leading,
  moreActionLabel,
  onPrimaryAction,
  primaryActionLabel,
  primaryIcon,
  reasons = [],
  state = "normal",
  stateLabel,
  title,
}: DenseItemRowProps) {
  const isCompleted = state === "completed";
  const isRecommended = state === "recommended";
  const hasStateLabel = stateLabel && (state === "pending" || state === "rejected");

  return (
    <article
      className={["surface-row", styles.row, isRecommended ? styles.recommended : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={styles.leading}>
        {leading ??
          (isCompleted ? (
            <CheckCircle2 aria-hidden="true" size={18} />
          ) : (
            <Circle aria-hidden="true" size={18} />
          ))}
      </span>
      <div className={styles.body}>
        <div className={styles.titleLine}>
          <span
            className={[
              styles.title,
              isCompleted ? styles.stateCompleted : "",
              state === "held" ? styles.stateHeld : "",
              state === "archived" ? styles.stateArchived : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {title}
          </span>
        </div>
        {date || area || hasStateLabel ? (
          <div className={styles.metaLine}>
            {date ? <span className={styles.pill}>{date}</span> : null}
            {area ? <span className={styles.pill}>{area}</span> : null}
            {state === "pending" && stateLabel ? (
              <span className={[styles.pill, styles.syncPending].join(" ")}>{stateLabel}</span>
            ) : null}
            {state === "rejected" && stateLabel ? (
              <span className={[styles.pill, styles.syncRejected].join(" ")}>{stateLabel}</span>
            ) : null}
          </div>
        ) : null}
        {reasons.length > 0 ? (
          <div className={styles.reasons}>
            {reasons.map((reason) => (
              <span className={styles.pill} key={reason}>
                {reason}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <IconButton
        aria-label={primaryActionLabel}
        icon={primaryIcon ?? <CheckCircle2 aria-hidden="true" size={17} />}
        onClick={onPrimaryAction}
        tooltip={primaryActionLabel}
      />
      <div className={styles.actions}>
        {actions ?? (
          <IconButton
            aria-label={moreActionLabel}
            icon={<MoreHorizontal aria-hidden="true" size={17} />}
            tooltip={moreActionLabel}
          />
        )}
      </div>
    </article>
  );
}
