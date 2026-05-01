import React from "react";

const variants = {
  primary: "bg-[#f84525] text-white hover:bg-[#d93a1e]",
  secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
  danger: "bg-red-600 text-white hover:bg-red-700",
  success: "bg-green-600 text-white hover:bg-green-700",
};

const Button = ({
  text,
  children,
  onClick,
  className = "",
  disabled = false,
  loading = false,
  type = "button",
  variant = "primary",
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`py-2 px-4 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        variants[variant] || variants.primary
      } ${className}`}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {text || "Processing..."}
        </span>
      ) : (
        children || text
      )}
    </button>
  );
};

export default Button;
