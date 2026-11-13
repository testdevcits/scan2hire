import React from "react";

const SelectField = ({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required,
  placeholder = "Select",
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
        className={`border rounded-sm px-3 py-2 mt-1 text-sm sm:text-base min-h-10 w-full min-w-0 bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#f84525] ${
          error ? "border-red-500" : "border-gray-300 dark:border-gray-700"
        }`}
      >
        <option value="">{placeholder}</option>
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
