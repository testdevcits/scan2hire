// src/pages/hr/HRDashboard.js
import React from "react";
import { useNavigate } from "react-router-dom";
import { FiUsers, FiFileText, FiBriefcase } from "react-icons/fi";

const HRDashboard = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: "Manage Employees",
      description: "View, add, or update employee profiles and details.",
      path: "/hr/employees", // <-- Absolute path
      icon: <FiUsers className="text-red-600 w-6 h-6" />,
    },
    {
      title: "View Reports",
      description: "Check HR reports, attendance, and performance metrics.",
      path: "/hr/reports", // <-- Absolute path
      icon: <FiFileText className="text-red-600 w-6 h-6" />,
    },
    {
      title: "Post Job Openings",
      description: "Add or manage job openings for recruitment.",
      path: "/hr/jobs", // <-- Absolute path
      icon: <FiBriefcase className="text-red-600 w-6 h-6" />,
    },
  ];

  return (
    <div className="p-3 md:p-4">
      <h2 className="text-2xl md:text-3xl font-semibold mb-4 md:mb-6 text-gray-800">
        HR Dashboard
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {actions.map((action) => (
          <div
            key={action.title}
            className="bg-white rounded-lg shadow hover:shadow-md transition cursor-pointer flex flex-col justify-between p-4 md:p-5"
            onClick={() => navigate(action.path)} // <-- Navigate to absolute path
          >
            <div className="flex items-center gap-3 mb-2">
              {action.icon}
              <h3 className="text-lg md:text-xl font-medium text-gray-800">
                {action.title}
              </h3>
            </div>
            <p className="text-gray-600 text-sm md:text-base">
              {action.description}
            </p>
            <button
              className="mt-3 self-start bg-red-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded hover:bg-red-700 transition text-sm md:text-base"
              onClick={() => navigate(action.path)} // <-- Also make button clickable
            >
              Go
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HRDashboard;
