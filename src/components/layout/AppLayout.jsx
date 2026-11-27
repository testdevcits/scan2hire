/* eslint-disable */
import { useApi } from "../../contexts/ApiContext";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import { AuthContext } from "../../contexts/AuthContext";
import { ThemeContext } from "../../contexts/ThemeContext";
import { useToast } from "../../contexts/ToastContext";
import { useModal } from "../../contexts/ModalContext";
import Sidebar from "./Sidebar";
import DashboardHeader from "./DashboardHeader";

const AppLayout = ({
  title,
  navItems,
  variant = "default",
  navLoading = false,
  canOpenProfile = true,
}) => {
  const { authApi } = useApi();
  const { user, logout } = useContext(AuthContext);
  const { mode, toggleMode } = useContext(ThemeContext);
  const toast = useToast();
  const { confirm } = useModal();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState("");
  const [profileSummary, setProfileSummary] = useState(null);
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: "Confirm logout",
      message: "Are you sure you want to logout?",
      confirmText: "Logout",
      cancelText: "Cancel",
      tone: "danger",
    });
    if (!confirmed) return;
    setProfileMenuOpen(false);
    logout();
    navigate("/login");
  };

  const getProfilePath = () => {
    const effectiveRole = user?.effectiveRole || user?.role;
    if (user?.role === "superadmin") return "/admin/settings";
    if (effectiveRole === "employee" || effectiveRole === "tester") return "/employee/profile";
    return "/hr/settings";
  };

  const openProfile = () => {
    setProfileMenuOpen(false);
    navigate(getProfilePath());
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
        setProfileSummary(data);
        setProfileImage(
          data.profileImage ||
            data.documents?.photo?.url ||
            data.employeeProfile?.documents?.photo?.url ||
            ""
        );
      })
      .catch(() => {
        if (mounted) {
          setProfileImage("");
          setProfileSummary(null);
        }
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
    const parts = String(user?.name || "U")
      .trim()
      .split(/\s+/);
    return parts
      .slice(0, 2)
      .map((item) => item[0]?.toUpperCase() || "")
      .join("");
  }, [user?.name]);

  const employeeProfile = profileSummary?.employeeProfile || profileSummary;
  const designationLabel =
    employeeProfile?.designation || user?.designation || user?.effectiveRole || user?.role;
  const departmentLabel = employeeProfile?.department || user?.department || "";
  const employeeRole = ["employee", "teamlead", "tester", "project_coordinator"].includes(
    user?.role
  );
  const profilePermissionAllowed = employeeRole
    ? profileSummary?.moduleAccess?.profile?.view !== false
    : canOpenProfile;

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

  return (
    <div
      className={`flex h-screen gap-3 overflow-hidden p-3 font-montserrat text-[15px] ${mode === "dark" ? "bg-gray-950" : "bg-[#f5f6f8]"}`}
    >
      <Sidebar
        title={title}
        navItems={navItems}
        variant={variant}
        navLoading={navLoading}
        mode={mode}
        toggleMode={toggleMode}
        designationLabel={designationLabel}
        employeeId={employeeProfile?.employeeId}
        sidebarOpen={sidebarOpen}
        onCloseMobile={closeMobileSidebar}
        onLogout={handleLogout}
      />

      <div className="flex min-w-0 min-h-0 h-full flex-1 flex-col overflow-hidden">
        <DashboardHeader
          mode={mode}
          user={user}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          designationLabel={designationLabel}
          departmentLabel={departmentLabel}
          profileImage={profileImage}
          initials={initials}
          profilePermissionAllowed={profilePermissionAllowed}
          profileMenuOpen={profileMenuOpen}
          onToggleProfileMenu={() => {
            setProfileMenuOpen((prev) => !prev);
            setNotificationOpen(false);
          }}
          onOpenProfile={openProfile}
          onLogout={handleLogout}
          onOpenNotifications={() => {
            setNotificationOpen(false);
            navigate("notifications");
          }}
          unreadCount={unreadCount}
          notificationOpen={notificationOpen}
          onCloseNotifications={() => setNotificationOpen(false)}
          notificationsLoading={notificationsLoading}
          notifications={notifications}
          onMarkNotificationRead={markNotificationRead}
          onDeleteNotification={deleteNotification}
        />

        <main
          className={`min-h-0 min-w-0 h-0 flex-1 overscroll-contain overflow-y-auto overflow-x-hidden pt-3 ${mode === "dark" ? "bg-gray-950" : ""}`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
