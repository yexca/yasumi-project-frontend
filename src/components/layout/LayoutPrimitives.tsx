import type { ReactNode } from "react";

import styles from "./LayoutPrimitives.module.css";

type HeaderProps = {
  actions?: ReactNode;
  description?: string;
  title: string;
};

export function ContentColumn({ children }: { children: ReactNode }) {
  return <div className={styles.contentColumn}>{children}</div>;
}

export function PageHeader({ actions, description, title }: HeaderProps) {
  return (
    <header className={styles.pageHeader}>
      <div className={styles.pageHeaderText}>
        <h2 className={styles.pageTitle}>{title}</h2>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      {actions}
    </header>
  );
}

export function SectionHeader({
  actions,
  count,
  description,
  title,
}: HeaderProps & { count?: number }) {
  return (
    <header className={styles.sectionHeader}>
      <div className={styles.sectionHeaderText}>
        <h3 className={styles.sectionTitle}>{title}</h3>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      {actions ??
        (typeof count === "number" ? <span className={styles.count}>{count}</span> : null)}
    </header>
  );
}

export function DetailPanel({ children }: { children: ReactNode }) {
  return <aside className={styles.detailPanel}>{children}</aside>;
}
