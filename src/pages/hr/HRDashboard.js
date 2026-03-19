// src/pages/hr/HRDashboard.js
import React from "react";
import { useNavigate } from "react-router-dom";

const HRDashboard = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: "Manage Employees",
      description: "View, add, or update employee profiles and details.",
      path: "employees",
    },
    {
      title: "View Reports",
      description: "Check HR reports, attendance, and performance metrics.",
      path: "reports",
    },
    {
      title: "Post Job Openings",
      description: "Add or manage job openings for recruitment.",
      path: "jobs",
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl font-semibold mb-6">HR Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {actions.map((action) => (
          <div
            key={action.title}
            className="bg-white rounded-xl shadow p-4 hover:shadow-lg transition cursor-pointer"
            onClick={() => navigate(action.path)}
          >
            <h3 className="text-lg font-medium mb-2">{action.title}</h3>
            <p className="text-gray-600">{action.description}</p>
            <button className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
              Go
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HRDashboard;
