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
}) => {
  return (
    <div className="flex flex-col">
      <label className="font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`border rounded-md p-2 mt-1 focus:outline-none focus:ring-2 focus:ring-[#f84525] ${
          error ? "border-[#f84525]" : "border-gray-300"
        }`}
      />
      {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
    </div>
  );
};

export default InputField;
