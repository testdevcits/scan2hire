import React from "react";

function CommonLoader({ text = "Loading..." }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-20 z-50">
      {/* Spinner */}
      <div className="w-10 h-10 border-4 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>

      {/* Text */}
      <p className="mt-3 text-sm text-gray-600">{text}</p>
    </div>
  );
}

export default CommonLoader;
