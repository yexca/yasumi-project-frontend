import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from "react";
import { useId } from "react";

import styles from "./Field.module.css";

type BaseFieldProps = {
  error?: string;
  label: string;
};

function FieldFrame({
  children,
  error,
  id,
  label,
}: BaseFieldProps & { children: ReactNode; id: string }) {
  return (
    <label className={styles.field} htmlFor={id}>
      <span className={styles.label}>{label}</span>
      {children}
      {error ? (
        <span className={styles.error} id={`${id}-error`}>
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function TextInput({
  error,
  id,
  label,
  ...props
}: BaseFieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <FieldFrame error={error} id={inputId} label={label}>
      <input
        aria-describedby={error ? `${inputId}-error` : undefined}
        aria-invalid={error ? true : undefined}
        className={styles.input}
        id={inputId}
        {...props}
      />
    </FieldFrame>
  );
}

export function TextArea({
  error,
  id,
  label,
  ...props
}: BaseFieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <FieldFrame error={error} id={inputId} label={label}>
      <textarea
        aria-describedby={error ? `${inputId}-error` : undefined}
        aria-invalid={error ? true : undefined}
        className={styles.textarea}
        id={inputId}
        {...props}
      />
    </FieldFrame>
  );
}

export function Select({
  children,
  error,
  id,
  label,
  ...props
}: BaseFieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <FieldFrame error={error} id={inputId} label={label}>
      <select
        aria-describedby={error ? `${inputId}-error` : undefined}
        aria-invalid={error ? true : undefined}
        className={styles.select}
        id={inputId}
        {...props}
      >
        {children}
      </select>
    </FieldFrame>
  );
}
