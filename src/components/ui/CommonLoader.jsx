import React from "react";

function CommonLoader({ text = "Loading...", fullScreen = false, compact = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center ${
        fullScreen ? "fixed inset-0 bg-black/20 z-50" : compact ? "py-4" : "py-10"
      }`}
    >
      <div className="w-9 h-9 border-4 border-gray-200 border-t-[#f84525] rounded-full animate-spin"></div>
      <p className="mt-3 text-sm font-medium text-gray-700">{text}</p>
    </div>
  );
}

export default CommonLoader;
