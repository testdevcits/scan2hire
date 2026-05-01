import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { ThemeContext } from "../contexts/ThemeContext"; // Theme context
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { FaQuestion } from "react-icons/fa6";
import {
  FiMenu,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiLogOut,
  FiSun,
  FiMoon,
} from "react-icons/fi";
import hrIcon from "../assets/logo.png";
const HRLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const { mode, toggleMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({});
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleMenu = (name) => {
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const isActiveLink = (path, subItems) => {
    if (location.pathname.startsWith(path)) return true;
    if (subItems)
      return subItems.some((sub) => location.pathname.startsWith(sub.path));
    return false;
  };

  const navItems = [
    { name: "Dashboard", path: "/hr/dashboard" },
    {
      name: "Manage Employees",
      path: "/hr/employees",
      subItems: [{ name: "Employees List", path: "/hr/employees/list" }],
    },
    {
      name: "Manage Candidate",
      path: "/hr/candidates",
      subItems: [{ name: "Candidate List", path: "/hr/candidates/list" }],
    },
    { name: "Reports", path: "/hr/reports" },
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest("#user-menu") && !e.target.closest("#user-icon")) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Tailwind classes based on theme
  const sidebarBg =
    mode === "light"
      ? "bg-white text-gray-800"
      : "bg-dark text-gray-100 border-r border-gray-400";
  const headerBg =
    mode === "light"
      ? "bg-white text-gray-800"
      : "bg-dark text-gray-100 border-b border-gray-400";
  const sidebarHover =
    mode === "light" ? "hover:bg-red-100" : "hover:bg-coolGray-700";

  return (
    <div
      className={`flex h-screen font-montserrat ${
        mode === "light" ? "bg-light" : "bg-coolGray-900"
      }`}
    >
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-56 ${sidebarBg} shadow-lg p-4 flex flex-col justify-between transform transition-transform duration-300 z-30 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:relative`}
      >
        <div>
          <h1 className="text-xl font-bold mb-4 text-header flex items-center gap-2">
            <img src={hrIcon} alt="HR Icon" className="w-6 h-6" />
            HR Panel
          </h1>
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const active = isActiveLink(item.path, item.subItems);
              return (
                <div key={item.name}>
                  <div
                    className={`flex items-center justify-between px-2 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 cursor-pointer ${
                      active
                        ? "bg-header text-white font-semibold"
                        : sidebarHover
                    }`}
                    onClick={() => item.subItems && toggleMenu(item.name)}
                  >
                    <NavLink
                      to={item.path}
                      className="flex-1"
                      end={!item.subItems}
                    >
                      {item.name}
                    </NavLink>
                    {item.subItems &&
                      (openMenus[item.name] ? (
                        <FiChevronUp />
                      ) : (
                        <FiChevronDown />
                      ))}
                  </div>

                  {item.subItems && openMenus[item.name] && (
                    <div className="ml-4 mt-1 flex flex-col gap-1">
                      {item.subItems.map((sub) => (
                        <NavLink
                          key={sub.name}
                          to={sub.path}
                          className={({ isActive }) =>
                            `px-2 py-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                              isActive
                                ? "bg-header text-white font-semibold"
                                : sidebarHover
                            }`
                          }
                          onClick={() => setSidebarOpen(false)}
                        >
                          {sub.name}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom user / theme menu */}
        <div className="relative">
          <button
            id="user-icon"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center justify-center w-full h-10 bg-gray-200 hover:bg-gray-300 transition-colors duration-200 mx-auto mb-2"
          >
            <FaQuestion className="hover:text-red-600" />
          </button>

          {userMenuOpen && (
            <div
              id="user-menu"
              className={`absolute left-1/2 -translate-x-1/2 bottom-14 w-44 shadow-md rounded-md border border-gray-200 p-2 flex flex-col gap-1 z-50 ${
                mode === "light"
                  ? "bg-white text-gray-800"
                  : "bg-coolGray-800 text-gray-100"
              }`}
            >
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm px-2 py-1 rounded-md hover:bg-red-100 text-red-600"
              >
                <FiLogOut /> Logout
              </button>
              <button
                onClick={toggleMode}
                className="flex items-center gap-2 text-sm px-2 py-1 rounded-md hover:bg-gray-100"
              >
                {mode === "light" ? <FiMoon /> : <FiSun />} Theme
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-22">
        <header
          className={`flex items-center justify-between shadow px-3 py-2 md:px-4 ${headerBg}`}
        >
          {/* Left side: Mobile menu button + Logo only on mobile */}
          <div className="flex items-center gap-2">
            <button
              className="md:hidden text-xl text-red-600"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>

          {/* Right side: Welcome text */}
          <span className="ml-auto font-semibold text-md md:text-lg">
            Welcome, {user?.name}
          </span>
        </header>

        <main className="flex-1 overflow-auto p-3 md:p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default HRLayout;
