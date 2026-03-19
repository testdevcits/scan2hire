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
    <div className="flex flex-col">
      <label className="font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`border rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-[#BF9B53] ${
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
