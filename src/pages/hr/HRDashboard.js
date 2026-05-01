// src/pages/hr/HRDashboard.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUsers, FiFileText, FiUserCheck } from "react-icons/fi";
import { authApi } from "../../api";

const HRDashboard = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    authApi
      .getNotifications()
      .then((res) => setNotifications(res.data.data || []))
      .catch(() => setNotifications([]));
  }, []);

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
      title: "Manage Candidates",
      description: "Review candidate forms and assign interview rounds.",
      path: "/hr/candidates/list",
      icon: <FiUserCheck className="text-red-600 w-6 h-6" />,
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

      <section className="mt-5 bg-white rounded-sm shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-800">Notifications</h3>
        </div>
        {notifications.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No notifications</p>
        ) : (
          notifications.slice(0, 8).map((item) => (
            <div key={item._id} className="border-t px-4 py-3 text-sm">
              <p className="font-medium">{item.title}</p>
              <p className="text-gray-600">{item.message}</p>
              <p className="text-xs text-gray-400">{new Date(item.createdAt).toLocaleString()}</p>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default HRDashboard;
