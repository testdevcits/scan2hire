import React, { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

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
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const canToggle = passwordToggle && type === "password";
  return (
    <div className={`flex flex-col min-w-0 ${hidden ? "hidden" : ""}`}>
      <label
        className={`font-medium text-sm text-gray-700 dark:text-gray-200 sm:text-base ${labelClassName}`}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute bottom-0 left-0 flex h-10 items-center border-r border-gray-300 px-3 text-sm font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300">
            {prefix}
          </span>
        )}
        <input
          type={canToggle && showPassword ? "text" : type}
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
          aria-invalid={Boolean(error)}
          aria-describedby={error && name ? `${name}-error` : undefined}
          className={`border rounded-sm px-3 py-2 mt-1 text-sm sm:text-base min-h-10 w-full min-w-0 bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#f84525] ${prefix ? "pl-16" : ""} ${canToggle ? "pr-12" : ""} ${inputClassName} ${
            error ? "border-[#f84525]" : "border-gray-300 dark:border-gray-700"
          }`}
        />
        {canToggle && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute right-1 bottom-0 flex h-10 w-10 items-center justify-center rounded-sm text-gray-500 hover:text-[#f84525] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f84525] dark:text-gray-300"
          >
            {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
          </button>
        )}
      </div>
      {error && (
        <span
          id={name ? `${name}-error` : undefined}
          role="alert"
          className="text-red-500 text-sm mt-1"
        >
          {error}
        </span>
      )}
    </div>
  );
};

export default InputField;
