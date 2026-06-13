import type { ButtonHTMLAttributes, ReactNode } from "react";

import { Tooltip } from "./Tooltip";
import styles from "./Button.module.css";

type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  fullWidth?: boolean;
  icon?: ReactNode;
  variant?: ButtonVariant;
};

export function Button({
  children,
  className,
  fullWidth = false,
  icon,
  type = "button",
  variant = "secondary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        styles.button,
        styles[variant],
        fullWidth ? styles.fullWidth : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      type={type}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "aria-label"> & {
  "aria-label": string;
  icon: ReactNode;
  tooltip?: string;
  variant?: ButtonVariant;
};

export function IconButton({
  "aria-label": ariaLabel,
  className,
  icon,
  tooltip,
  type = "button",
  variant = "quiet",
  ...props
}: IconButtonProps) {
  const button = (
    <button
      aria-label={ariaLabel}
      className={[styles.iconButton, styles[variant], className ?? ""].filter(Boolean).join(" ")}
      type={type}
      {...props}
    >
      {icon}
    </button>
  );

  return tooltip ? <Tooltip content={tooltip}>{button}</Tooltip> : button;
}
