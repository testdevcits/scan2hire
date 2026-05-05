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
    <div className="flex flex-col min-w-0">
      <label className="font-medium text-sm sm:text-base">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`border rounded-sm px-3 py-2 mt-1 text-sm sm:text-base min-h-10 w-full min-w-0 focus:outline-none focus:ring-2 focus:ring-[#f84525] ${
          error ? "border-[#f84525]" : "border-gray-300"
        }`}
      />
      {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
    </div>
  );
};

export default InputField;
