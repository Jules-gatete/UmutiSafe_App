import React from 'react';

export default function Textarea({
  label,
  id,
  value,
  onChange,
  placeholder,
  required = false,
  rows = 4,
  error,
  ...props
}) {
  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium mb-2 text-text-dark dark:text-text-light"
        >
          {label} {required && <span className="text-warning">*</span>}
        </label>
      )}
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className="input-field resize-none"
        aria-required={required}
        aria-invalid={error ? 'true' : 'false'}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-warning" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
