// src/layouts/HRLayout.js
import React, { useContext, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";

const HRLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/hr/dashboard" },
    { name: "Manage Employees", path: "/hr/employees" },
    { name: "View Reports", path: "/hr/reports" },
    { name: "Post Job Openings", path: "/hr/jobs" },
  ];

  return (
    <div className="flex h-screen font-montserrat text-dark bg-system-background">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-md p-6 transform transition-transform duration-300 z-30 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:relative`}
      >
        <h1 className="text-2xl font-bold text-red-500 mb-8">HR Panel</h1>
        <nav className="flex flex-col gap-3">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg transition-colors duration-200 font-medium hover:bg-yellow-500 ${
                  isActive
                    ? "bg-yellow-500 text-white font-semibold"
                    : "text-systemText"
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              {item.name}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="mt-6 w-full bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200"
          >
            Logout
          </button>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-22">
        {/* Top Navbar */}
        <header className="flex items-center justify-between bg-white shadow-md px-4 py-3 md:px-6">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-2xl text-red-500"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <FiX /> : <FiMenu />}
            </button>
            <span className="font-semibold text-lg md:text-xl text-systemText">
              Welcome, {user?.name}
            </span>
          </div>
          <div>{/* Optional: user avatar / actions */}</div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-system-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default HRLayout;
