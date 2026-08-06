"use client";

import {
  useId,
  useState,
} from "react";

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  pattern?: string;
  title?: string;
}

export default function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  minLength,
  pattern,
  title,
}: PasswordFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-medium"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          required={required}
          minLength={minLength}
          pattern={pattern}
          title={title}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          className="field-control pr-12"
        />

        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={
            visible ? "Hide password" : "Show password"
          }
          title={
            visible ? "Hide password" : "Show password"
          }
          className="password-toggle absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md"
        >
          {visible ? (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            >
              <path d="M3 3l18 18" />
              <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
              <path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c5 0 8.3 4 9.5 6a3.4 3.4 0 0 1 0 4 13.2 13.2 0 0 1-2.4 2.8" />
              <path d="M6.6 6.6A13 13 0 0 0 2.5 10a3.4 3.4 0 0 0 0 4c1.2 2 4.5 6 9.5 6a10.9 10.9 0 0 0 4.3-.9" />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            >
              <path d="M2.5 10a3.4 3.4 0 0 0 0 4c1.2 2 4.5 6 9.5 6s8.3-4 9.5-6a3.4 3.4 0 0 0 0-4c-1.2-2-4.5-6-9.5-6s-8.3 4-9.5 6Z" />
              <circle
                cx="12"
                cy="12"
                r="3"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
