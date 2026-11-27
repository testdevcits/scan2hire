import { FiBell, FiLogOut, FiMenu, FiTrash2, FiUser, FiX } from "react-icons/fi";

const DashboardHeader = ({
  mode,
  user,
  sidebarOpen,
  onToggleSidebar,
  designationLabel,
  departmentLabel,
  profileImage,
  initials,
  profilePermissionAllowed,
  profileMenuOpen,
  onToggleProfileMenu,
  onOpenProfile,
  onLogout,
  onOpenNotifications,
  unreadCount,
  notificationOpen,
  onCloseNotifications,
  notificationsLoading,
  notifications,
  onMarkNotificationRead,
  onDeleteNotification,
}) => (
  <header
    className={`${mode === "dark" ? "bg-gray-900 text-white border-gray-700" : "bg-white border-gray-200"} rounded-[18px] border shadow-[0_12px_30px_rgba(15,23,42,0.08)] px-4 py-3 flex items-center gap-3 sticky top-0 z-20`}
  >
    <button className="md:hidden text-xl text-[#f84525]" onClick={onToggleSidebar}>
      {sidebarOpen ? <FiX /> : <FiMenu />}
    </button>
    <div className="min-w-0 flex-1">
      <p className={`font-semibold truncate ${mode === "dark" ? "text-white" : "text-gray-800"}`}>
        Welcome, {user?.name}
      </p>
      <p className={`text-xs truncate ${mode === "dark" ? "text-gray-400" : "text-gray-500"}`}>
        {[designationLabel, departmentLabel].filter(Boolean).join(" / ")}
      </p>
    </div>
    <div className="ml-auto flex items-center gap-3 shrink-0">
      <div className="relative sm:hidden shrink-0">
        <button
          type="button"
          onClick={onToggleProfileMenu}
          className="w-10 h-10 rounded-[14px] overflow-hidden bg-[#fff5f3] border border-[#ffd8cf] flex items-center justify-center text-[#f84525] font-semibold"
          aria-label="Open profile menu"
        >
          {profileImage ? (
            <img
              src={profileImage}
              alt={user?.name || "Profile"}
              className="w-full h-full object-cover"
            />
          ) : (
            initials || "U"
          )}
        </button>
        {profileMenuOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-[16px] border bg-white shadow-xl z-50 overflow-hidden text-left">
            <div className="px-4 py-3 border-b">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            {profilePermissionAllowed && (
              <button
                type="button"
                onClick={onOpenProfile}
                className="w-full px-4 py-3 text-sm text-gray-700 hover:bg-[#fff5f3] hover:text-[#f84525] flex items-center gap-2"
              >
                <FiUser /> Profile
              </button>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t"
            >
              <FiLogOut /> Logout
            </button>
          </div>
        )}
      </div>
      <button
        onClick={onOpenNotifications}
        className={`relative w-10 h-10 rounded-[14px] border flex items-center justify-center hover:text-[#f84525] ${mode === "dark" ? "bg-gray-800 border-gray-700 text-white" : "bg-white text-gray-800"}`}
        aria-label="Notifications"
      >
        <FiBell />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#f84525] text-white text-[10px] min-w-5 h-5 px-1 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      <div className="relative hidden sm:flex items-center gap-3 min-w-0">
        {profileMenuOpen && (
          <div className="absolute right-0 top-12 w-56 rounded-[16px] border bg-white shadow-xl z-50 overflow-hidden text-left">
            <div className="px-4 py-3 border-b">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            {profilePermissionAllowed && (
              <button
                type="button"
                onClick={onOpenProfile}
                className="w-full px-4 py-3 text-sm text-gray-700 hover:bg-[#fff5f3] hover:text-[#f84525] flex items-center gap-2"
              >
                <FiUser /> Profile
              </button>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t"
            >
              <FiLogOut /> Logout
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onToggleProfileMenu}
          className="w-10 h-10 rounded-[14px] overflow-hidden bg-[#fff5f3] border border-[#ffd8cf] flex items-center justify-center text-[#f84525] font-semibold shrink-0"
          aria-label="Open profile menu"
        >
          {profileImage ? (
            <img
              src={profileImage}
              alt={user?.name || "Profile"}
              className="w-full h-full object-cover"
            />
          ) : (
            initials || "U"
          )}
        </button>
      </div>

      <div className="relative shrink-0">
        {notificationOpen && (
          <div className="absolute right-0 mt-2 w-[min(92vw,380px)] bg-white border shadow-xl rounded-[16px] z-50 overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              <button onClick={onCloseNotifications} className="text-gray-500 hover:text-gray-900">
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
                    onClick={() => onMarkNotificationRead(item._id)}
                    className={`p-4 border-b text-sm cursor-pointer ${
                      item.isRead ? "bg-white" : "bg-[#fff5f3]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-semibold ${item.isRead ? "text-gray-800" : "text-gray-950"}`}
                        >
                          {item.title}
                        </p>
                        <p className="text-gray-600 mt-1">{item.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {["hr", "superadmin", "teamlead"].includes(user?.role) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteNotification(item._id);
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
);

export default DashboardHeader;
