import SidebarLayout from "./SidebarLayout";
import { FiBarChart2, FiBriefcase, FiLock, FiMonitor, FiSettings, FiShield, FiUserCheck, FiUsers } from "react-icons/fi";

const AdminLayout = () => {
  const navItems = [
    { label: "Dashboard", path: "/admin/dashboard", end: true, icon: <FiBarChart2 /> },
    { label: "Manage HR", path: "/admin/hrs", icon: <FiBriefcase /> },
    { label: "Employees", path: "/admin/employees", icon: <FiUsers /> },
    { label: "Candidates", path: "/admin/candidates", icon: <FiUserCheck /> },
    { label: "Attendance Reports", path: "/admin/reports", icon: <FiBarChart2 /> },
    { label: "Leave Reports", path: "/admin/leave-reports", icon: <FiBarChart2 /> },
    { label: "Credentials", path: "/admin/credentials", icon: <FiLock /> },
    { label: "Access Control", path: "/admin/access-control", icon: <FiShield /> },
    { label: "System Allotments", path: "/admin/system-allotments", icon: <FiMonitor /> },
    { label: "Settings", path: "/admin/settings", icon: <FiSettings /> },
  ];

  return <SidebarLayout title="Super Admin" navItems={navItems} variant="admin" />;
};

export default AdminLayout;
