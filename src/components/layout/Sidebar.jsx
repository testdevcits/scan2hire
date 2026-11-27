import { NavLink } from "react-router-dom";
import { FiLogOut, FiMoon, FiSun } from "react-icons/fi";
import logo from "../../assets/images/logo.png";

const Sidebar = ({
  title,
  navItems,
  variant = "default",
  navLoading = false,
  mode,
  toggleMode,
  designationLabel,
  employeeId,
  sidebarOpen,
  onCloseMobile,
  onLogout,
}) => {
  const isAdmin = variant === "admin";
  const asideClass = isAdmin
    ? "bg-[#0b1220] text-white border border-[#f84525]/50"
    : mode === "dark"
      ? "bg-gray-900 text-white border border-gray-700"
      : "bg-white border border-gray-200";
  const activeClass = isAdmin
    ? "bg-[#f84525] text-white border border-[#ff896f] shadow-sm"
    : "bg-header text-white border border-header";
  const inactiveClass = isAdmin
    ? "text-gray-200 border border-white/10 hover:bg-[#162036] hover:text-white hover:border-white/20"
    : mode === "dark"
      ? "text-gray-300 border border-gray-800 hover:bg-gray-800 hover:text-white hover:border-gray-700"
      : "text-gray-700 border border-transparent hover:bg-red-50 hover:text-[#f84525] hover:border-red-100";

  return (
    <>
      <aside
        className={`fixed left-3 top-3 h-[calc(100vh-1.5rem)] w-64 ${asideClass} rounded-[18px] shadow-[0_18px_45px_rgba(15,23,42,0.12)] p-4 flex flex-col transform transition-transform duration-300 z-40 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-[110%]"
        } md:relative md:left-auto md:top-auto md:translate-x-0`}
      >
        <div className="shrink-0">
          <div
            className={`flex items-center gap-2 mb-5 pb-4 border-b ${isAdmin ? "border-white/15" : mode === "dark" ? "border-gray-800" : "border-gray-200"}`}
          >
            <img src={logo} alt="Scan2Hire" className="w-7 h-7" />
            <div>
              <h1 className={`text-lg font-bold ${isAdmin ? "text-white" : "text-header"}`}>
                {title}
              </h1>
              <p className={`text-xs ${isAdmin ? "text-gray-400" : "text-gray-500"}`}>
                {designationLabel}
              </p>
              {employeeId && (
                <p className={`text-[11px] ${isAdmin ? "text-gray-500" : "text-gray-400"}`}>
                  ID: {employeeId}
                </p>
              )}
            </div>
          </div>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-1.5 sidebar-scroll">
          {navLoading
            ? Array.from({ length: 8 }, (_, index) => (
                <div
                  key={index}
                  className="h-10 shrink-0 animate-pulse rounded-[12px] bg-gray-200/70 dark:bg-gray-800/70"
                />
              ))
            : navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `px-3 py-2.5 rounded-[12px] text-[15px] font-semibold transition-colors shrink-0 ${
                      isActive ? activeClass : inactiveClass
                    }`
                  }
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                    {Number(item.badge || 0) > 0 ? (
                      <span className="ml-auto min-w-5 rounded-full bg-[#f84525] px-1.5 py-0.5 text-center text-[11px] font-bold text-white">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    ) : null}
                  </span>
                </NavLink>
              ))}
        </nav>

        <div
          className={`shrink-0 space-y-2 pt-3 mt-3 border-t ${isAdmin ? "border-white/15" : mode === "dark" ? "border-gray-800" : "border-gray-200"}`}
        >
          <button
            onClick={toggleMode}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-[12px] text-sm ${
              isAdmin ? "bg-zinc-900 hover:bg-zinc-800 text-white" : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {mode === "light" ? <FiMoon /> : <FiSun />} Theme
          </button>
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-[12px] text-sm ${
              isAdmin
                ? "bg-white text-black hover:bg-gray-200"
                : "text-red-600 bg-red-50 hover:bg-red-100"
            }`}
          >
            <FiLogOut /> Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={onCloseMobile} />
      )}
    </>
  );
};

export default Sidebar;
