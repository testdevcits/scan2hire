import React from "react";

const Button = ({ text, onClick, className = "", disabled = false }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`bg-[#f84525] text-white py-2 px-4 rounded-md font-medium hover:bg-[#f84525]-100 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {text}
    </button>
  );
};

export default Button;
