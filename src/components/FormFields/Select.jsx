import React from 'react';

export default function Select({
  label,
  id,
  value,
  onChange,
  options = [],
  required = false,
  error,
  placeholder = 'Select an option',
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
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        className="input-field"
        aria-required={required}
        aria-invalid={error ? 'true' : 'false'}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-warning" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
