import { useContext, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { FiLogOut, FiMenu, FiMoon, FiSun, FiX } from "react-icons/fi";
import { AuthContext } from "../contexts/AuthContext";
import { ThemeContext } from "../contexts/ThemeContext";
import logo from "../assets/logo.png";

const SidebarLayout = ({ title, navItems, variant = "default" }) => {
  const { user, logout } = useContext(AuthContext);
  const { mode, toggleMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeMobileSidebar = () => setSidebarOpen(false);

  const isAdmin = variant === "admin";
  const asideClass = isAdmin ? "bg-black text-white" : "bg-white";
  const activeClass = isAdmin ? "bg-white text-black" : "bg-header text-white";
  const inactiveClass = isAdmin
    ? "text-gray-300 hover:bg-white hover:text-black"
    : "text-gray-700 hover:bg-red-50 hover:text-[#f84525]";

  return (
    <div className="flex h-screen font-montserrat bg-light">
      <aside
        className={`fixed top-0 left-0 h-full w-64 ${asideClass} shadow-lg p-4 flex flex-col justify-between transform transition-transform duration-300 z-40 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:relative`}
      >
        <div>
          <div className="flex items-center gap-2 mb-5">
            <img src={logo} alt="Scan2Hire" className="w-7 h-7" />
            <div>
              <h1 className={`text-lg font-bold ${isAdmin ? "text-white" : "text-header"}`}>{title}</h1>
              <p className={`text-xs ${isAdmin ? "text-gray-400" : "text-gray-500"}`}>{user?.role}</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={closeMobileSidebar}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-sm text-sm font-medium transition-colors ${
                    isActive ? activeClass : inactiveClass
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="space-y-2">
          <button
            onClick={toggleMode}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-sm text-sm ${
              isAdmin ? "bg-zinc-900 hover:bg-zinc-800 text-white" : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {mode === "light" ? <FiMoon /> : <FiSun />} Theme
          </button>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-sm text-sm ${
              isAdmin ? "bg-white text-black hover:bg-gray-200" : "text-red-600 bg-red-50 hover:bg-red-100"
            }`}
          >
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow px-4 py-3 flex items-center gap-3">
          <button
            className="md:hidden text-xl text-[#f84525]"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
          <span className="font-semibold text-gray-800">
            Welcome, {user?.name}
          </span>
        </header>

        <main className="flex-1 overflow-auto p-3 md:p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SidebarLayout;
