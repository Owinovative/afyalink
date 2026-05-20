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
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <label>
      {label}
      <input name={name} type={type} required={required} placeholder={placeholder} defaultValue={defaultValue} />
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
