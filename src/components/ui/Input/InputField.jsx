import React, { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { resolveInputClasses } from "./inputConfig";

const InputField = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  type = "text",
  placeholder,
  error,
  required,
  min,
  max,
  step,
  minLength,
  maxLength,
  pattern,
  inputMode,
  autoComplete,
  disabled = false,
  labelClassName = "",
  inputClassName = "",
  passwordToggle = false,
  prefix,
  hidden = false,
  size = "md",
  variant = "default",
  shape = "square",
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const canToggle = passwordToggle && type === "password";
  const errorText = error?.message || error;

  return (
    <div className={`flex min-w-0 flex-col ${hidden ? "hidden" : ""}`}>
      {label && (
        <label htmlFor={name} className={`text-sm font-medium text-gray-700 dark:text-gray-200 ${labelClassName}`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative mt-1">
        {prefix && <span className="pointer-events-none absolute bottom-0 left-0 flex h-10 items-center border-r border-gray-300 px-3 text-sm font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300">{prefix}</span>}
        <input
          {...props}
          type={canToggle && showPassword ? "text" : type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          step={step}
          minLength={minLength}
          maxLength={maxLength}
          pattern={pattern}
          inputMode={inputMode}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={Boolean(errorText)}
          aria-describedby={errorText && name ? `${name}-error` : undefined}
          className={resolveInputClasses({
            variant,
            size,
            shape,
            error: Boolean(errorText),
            hasRightIcon: canToggle,
            className: `${prefix ? "pl-16" : ""} ${canToggle ? "pr-12" : ""} ${inputClassName}`,
          })}
        />
        {canToggle && (
          <button type="button" disabled={disabled} onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className="absolute right-1 bottom-0 flex h-10 w-10 items-center justify-center rounded-sm text-gray-500 hover:text-[#f84525] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f84525] dark:text-gray-300">
            {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
          </button>
        )}
      </div>
      {errorText && <span id={name ? `${name}-error` : undefined} role="alert" className="mt-1 text-sm text-red-500">{errorText}</span>}
    </div>
  );
};

export default InputField;
