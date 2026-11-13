import React from "react";

const InputField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  required,
  min,
  max,
  minLength,
  maxLength,
  pattern,
  inputMode,
  autoComplete,
  disabled = false,
}) => {
  return (
    <div className="flex flex-col min-w-0">
      <label className="font-medium text-sm text-gray-700 dark:text-gray-200 sm:text-base">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        minLength={minLength}
        maxLength={maxLength}
        pattern={pattern}
        inputMode={inputMode}
        autoComplete={autoComplete}
        disabled={disabled}
        className={`border rounded-sm px-3 py-2 mt-1 text-sm sm:text-base min-h-10 w-full min-w-0 bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#f84525] ${
          error ? "border-[#f84525]" : "border-gray-300 dark:border-gray-700"
        }`}
      />
      {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
    </div>
  );
};

export default InputField;
