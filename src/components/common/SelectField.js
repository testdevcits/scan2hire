import React from "react";

const SelectField = ({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required,
}) => {
  return (
    <div className="flex flex-col min-w-0">
      <label className="font-medium text-sm sm:text-base">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`border rounded-sm px-3 py-2 mt-1 text-sm sm:text-base min-h-10 w-full min-w-0 focus:outline-none focus:ring-2 focus:ring-[#f84525] ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      >
        <option value="">Select</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
    </div>
  );
};

export default SelectField;
