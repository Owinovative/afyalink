"use client";

import { FormEvent } from "react";

export function formValues(event: FormEvent<HTMLFormElement>) {
  const formData = new FormData(event.currentTarget);
  const values: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) continue;
    const text = String(value).trim();
    if (text !== "") values[key] = text;
  }

  return values;
}

export function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  defaultValue,
  autoComplete,
  inputMode,
  min,
  minLength,
  pattern,
  title,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  autoComplete?: string;
  inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
  min?: string;
  minLength?: number;
  pattern?: string;
  title?: string;
}) {
  return (
    <label>
      {label}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        inputMode={inputMode}
        min={min}
        minLength={minLength}
        pattern={pattern}
        title={title}
      />
    </label>
  );
}

export function TextArea({
  label,
  name,
  required = false,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <label className="full">
      {label}
      <textarea name={name} required={required} placeholder={placeholder} defaultValue={defaultValue} />
    </label>
  );
}
