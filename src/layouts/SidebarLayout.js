import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { FiBell, FiLogOut, FiMenu, FiMoon, FiSun, FiTrash2, FiX } from "react-icons/fi";
import { authApi } from "../api";
import { AuthContext } from "../contexts/AuthContext";
import { ThemeContext } from "../contexts/ThemeContext";
import { useToast } from "../contexts/ToastContext";
import logo from "../assets/logo.png";

const SidebarLayout = ({ title, navItems, variant = "default" }) => {
  const { user, logout } = useContext(AuthContext);
  const { mode, toggleMode } = useContext(ThemeContext);
  const toast = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState("");
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeMobileSidebar = () => setSidebarOpen(false);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    setNotificationsLoading(true);
    try {
      const res = await authApi.getNotifications();
      setNotifications(res.data.data || []);
    } catch {
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    let mounted = true;
    if (!user) return undefined;
    authApi
      .getProfile()
      .then((res) => {
        if (!mounted) return;
        const data = res.data.data || {};
        setProfileImage(
          data.profileImage ||
            data.documents?.photo?.url ||
            data.employeeProfile?.documents?.photo?.url ||
            ""
        );
      })
      .catch(() => {
        if (mounted) setProfileImage("");
      });
    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    const handleProfileImageUpdate = (event) => {
      if (event?.detail?.url) {
        setProfileImage(event.detail.url);
      }
    };

    window.addEventListener("profile-image-updated", handleProfileImageUpdate);
    return () => window.removeEventListener("profile-image-updated", handleProfileImageUpdate);
  }, []);

  const initials = useMemo(() => {
    const parts = String(user?.name || "U").trim().split(/\s+/);
    return parts.slice(0, 2).map((item) => item[0]?.toUpperCase() || "").join("");
  }, [user?.name]);

  const deleteNotification = async (notificationId) => {
    try {
      await authApi.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((item) => item._id !== notificationId));
      toast.success("Notification deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to delete notification");
    }
  };

  const markNotificationRead = async (notificationId) => {
    const target = notifications.find((item) => item._id === notificationId);
    if (!target || target.isRead) return;
    setNotifications((prev) =>
      prev.map((item) => (item._id === notificationId ? { ...item, isRead: true } : item))
    );
    try {
      await authApi.markNotificationRead(notificationId);
    } catch {
      setNotifications((prev) =>
        prev.map((item) => (item._id === notificationId ? { ...item, isRead: false } : item))
      );
    }
  };

  const isAdmin = variant === "admin";
  const asideClass = isAdmin
    ? "bg-[#0b1220] text-white border-r-4 border-[#f84525]"
    : mode === "dark"
    ? "bg-gray-900 text-white border-r-2 border-gray-700"
    : "bg-white border-r-2 border-gray-200";
  const activeClass = isAdmin
    ? "bg-[#f84525] text-white border border-[#ff896f] shadow-sm"
    : "bg-header text-white border border-header";
  const inactiveClass = isAdmin
    ? "text-gray-200 border border-white/10 hover:bg-[#162036] hover:text-white hover:border-white/20"
    : mode === "dark"
    ? "text-gray-300 border border-gray-800 hover:bg-gray-800 hover:text-white hover:border-gray-700"
    : "text-gray-700 border border-transparent hover:bg-red-50 hover:text-[#f84525] hover:border-red-100";

  return (
    <div className={`flex h-screen font-montserrat text-[15px] ${mode === "dark" ? "bg-gray-950" : "bg-[#f5f6f8]"}`}>
      <aside
        className={`fixed top-0 left-0 h-full w-64 ${asideClass} shadow-xl p-4 flex flex-col transform transition-transform duration-300 z-40 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:relative`}
      >
        <div className="shrink-0">
          <div className={`flex items-center gap-2 mb-5 pb-4 border-b ${isAdmin ? "border-white/15" : mode === "dark" ? "border-gray-800" : "border-gray-200"}`}>
            <img src={logo} alt="Scan2Hire" className="w-7 h-7" />
            <div>
              <h1 className={`text-lg font-bold ${isAdmin ? "text-white" : "text-header"}`}>{title}</h1>
              <p className={`text-xs ${isAdmin ? "text-gray-400" : "text-gray-500"}`}>{user?.role}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-1.5 sidebar-scroll">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={closeMobileSidebar}
              className={({ isActive }) =>
                `px-3 py-2.5 rounded-sm text-[15px] font-semibold transition-colors shrink-0 ${
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

        <div className={`shrink-0 space-y-2 pt-3 mt-3 border-t ${isAdmin ? "border-white/15" : mode === "dark" ? "border-gray-800" : "border-gray-200"}`}>
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
        <header className={`${mode === "dark" ? "bg-gray-900 text-white" : "bg-white"} shadow-sm px-4 py-3 flex items-center gap-3 sticky top-0 z-20`}>
          <button
            className="md:hidden text-xl text-[#f84525]"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            {sidebarOpen ? <FiX /> : <FiMenu />}
          </button>
          <div className="min-w-0 flex-1">
            <p className={`font-semibold truncate ${mode === "dark" ? "text-white" : "text-gray-800"}`}>
              Welcome, {user?.name}
            </p>
            <p className={`text-xs truncate ${mode === "dark" ? "text-gray-400" : "text-gray-500"}`}>
              {user?.email}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-3 min-w-0">
              <div className="text-right min-w-0">
                <p className={`text-sm font-semibold truncate ${mode === "dark" ? "text-white" : "text-gray-800"}`}>
                  {user?.name}
                </p>
                <p className={`text-xs truncate ${mode === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                  {user?.role}
                </p>
              </div>
              <div className="w-10 h-10 rounded-sm overflow-hidden bg-[#fff5f3] border border-[#ffd8cf] flex items-center justify-center text-[#f84525] font-semibold shrink-0">
                {profileImage ? (
                  <img src={profileImage} alt={user?.name || "Profile"} className="w-full h-full object-cover" />
                ) : (
                  initials || "U"
                )}
              </div>
            </div>
            <div className="relative shrink-0">
            <button
              onClick={() => {
                setNotificationOpen((prev) => !prev);
                loadNotifications();
              }}
              className={`relative w-10 h-10 rounded-sm border flex items-center justify-center hover:text-[#f84525] ${mode === "dark" ? "bg-gray-800 border-gray-700 text-white" : "bg-white text-gray-800"}`}
              aria-label="Notifications"
            >
              <FiBell />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#f84525] text-white text-[10px] min-w-5 h-5 px-1 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {notificationOpen && (
              <div className="absolute right-0 mt-2 w-[min(92vw,380px)] bg-white border shadow-xl rounded-sm z-50 overflow-hidden">
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <h3 className="font-semibold">Notifications</h3>
                  <button onClick={() => setNotificationOpen(false)} className="text-gray-500 hover:text-gray-900">
                    <FiX />
                  </button>
                </div>
                <div className="max-h-96 overflow-auto">
                  {notificationsLoading ? (
                    <p className="p-4 text-sm text-gray-500">Loading...</p>
                  ) : notifications.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500">No notifications</p>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item._id}
                        onClick={() => markNotificationRead(item._id)}
                        className={`p-4 border-b text-sm cursor-pointer ${
                          item.isRead ? "bg-white" : "bg-[#fff5f3]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold ${item.isRead ? "text-gray-800" : "text-gray-950"}`}>{item.title}</p>
                            <p className="text-gray-600 mt-1">{item.message}</p>
                            <p className="text-xs text-gray-400 mt-2">{new Date(item.createdAt).toLocaleString()}</p>
                          </div>
                          {["hr", "superadmin", "teamlead"].includes(user?.role) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(item._id);
                              }}
                              className="text-gray-400 hover:text-red-600"
                              aria-label="Delete notification"
                            >
                              <FiTrash2 />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            </div>
          </div>
        </header>

        <main className={`flex-1 overflow-auto p-3 md:p-5 ${mode === "dark" ? "bg-gray-950" : ""}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SidebarLayout;
