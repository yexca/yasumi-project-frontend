import type { InputHTMLAttributes } from "react";

import styles from "./ChoiceControls.module.css";

export function Checkbox({
  label,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string }) {
  return (
    <label className={styles.checkboxLabel}>
      <input className={styles.checkbox} type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  );
}

export function Toggle({
  label,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string }) {
  return (
    <label className={styles.toggleLabel}>
      <span>{label}</span>
      <span className={styles.toggle}>
        <input className={styles.toggleInput} type="checkbox" {...props} />
        <span className={styles.toggleThumb} />
      </span>
    </label>
  );
}

export type SegmentedControlOption<TValue extends string> = {
  label: string;
  value: TValue;
};

type SegmentedControlProps<TValue extends string> = {
  "aria-label": string;
  onChange: (value: TValue) => void;
  options: SegmentedControlOption<TValue>[];
  value: TValue;
};

export function SegmentedControl<TValue extends string>({
  "aria-label": ariaLabel,
  onChange,
  options,
  value,
}: SegmentedControlProps<TValue>) {
  return (
    <div aria-label={ariaLabel} className={styles.segmented} role="group">
      {options.map((option) => (
        <button
          aria-pressed={option.value === value}
          className={[styles.segment, option.value === value ? styles.selected : ""]
            .filter(Boolean)
            .join(" ")}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
