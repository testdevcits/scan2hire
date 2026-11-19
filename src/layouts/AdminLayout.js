import SidebarLayout from "./SidebarLayout";
import { FiBarChart2, FiBriefcase, FiClock, FiGrid, FiLock, FiMonitor, FiSettings, FiShield, FiUserCheck, FiUsers } from "react-icons/fi";

const AdminLayout = () => {
  const navItems = [
    { label: "Dashboard", path: "/admin/dashboard", end: true, icon: <FiBarChart2 /> },
    { label: "Role & Access", path: "/admin/hrs", icon: <FiBriefcase /> },
    { label: "Master Data", path: "/admin/departments", icon: <FiGrid /> },
    { label: "Employees", path: "/admin/employees", icon: <FiUsers /> },
    { label: "Candidates", path: "/admin/candidates", icon: <FiUserCheck /> },
    { label: "Today Check-ins", path: "/admin/today-checkins", icon: <FiClock /> },
    { label: "Attendance Reports", path: "/admin/reports", icon: <FiBarChart2 /> },
    { label: "Leave Reports", path: "/admin/leave-reports", icon: <FiBarChart2 /> },
    { label: "Credentials", path: "/admin/credentials", icon: <FiLock /> },
    { label: "Access for System", path: "/admin/roles-access", icon: <FiShield /> },
    { label: "Activity Logs", path: "/admin/audit-logs", icon: <FiClock /> },
    { label: "System Allotments", path: "/admin/system-allotments", icon: <FiMonitor /> },
    { label: "Settings", path: "/admin/settings", icon: <FiSettings /> },
  ];

  return <SidebarLayout title="Super Admin" navItems={navItems} variant="admin" />;
};

export default AdminLayout;
