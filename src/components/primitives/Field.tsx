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
  required?: boolean;
};

function FieldFrame({
  children,
  error,
  id,
  label,
  required = false,
}: BaseFieldProps & { children: ReactNode; id: string }) {
  return (
    <label className={styles.field} htmlFor={id}>
      <span className={styles.label}>
        <span>{label}</span>
        {required ? (
          <span aria-hidden="true" className={styles.requiredMark}>
            *
          </span>
        ) : null}
      </span>
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
  required,
  ...props
}: BaseFieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <FieldFrame error={error} id={inputId} label={label} required={required}>
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
  required,
  ...props
}: BaseFieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <FieldFrame error={error} id={inputId} label={label} required={required}>
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
  required,
  ...props
}: BaseFieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <FieldFrame error={error} id={inputId} label={label} required={required}>
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
