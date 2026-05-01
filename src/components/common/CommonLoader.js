import React from "react";

function CommonLoader({ text = "Loading...", fullScreen = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center ${
        fullScreen ? "fixed inset-0 bg-black/20 z-50" : "py-10"
      }`}
    >
      <div className="w-10 h-10 border-4 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
      <p className="mt-3 text-sm text-gray-600">{text}</p>
    </div>
  );
}

export default CommonLoader;
