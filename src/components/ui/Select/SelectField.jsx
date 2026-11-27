import React from "react";
import { resolveInputClasses } from "../Input/inputConfig";

const SelectField = ({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required,
  placeholder = "Select",
  showPlaceholder = true,
  size = "md",
  variant = "default",
  shape = "square",
}) => {
  return (
    <div className="flex flex-col min-w-0">
      <label className="font-medium text-sm text-gray-700 dark:text-gray-200 sm:text-base">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        className={resolveInputClasses({ variant, size, shape, error })}
      >
        {showPlaceholder && !value && <option value="">{placeholder}</option>}
        {options.map((option) => {
          const optionValue = typeof option === "string" ? option : option.value;
          const optionLabel = typeof option === "string" ? option : option.label;
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
      {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
    </div>
  );
};

export default SelectField;
