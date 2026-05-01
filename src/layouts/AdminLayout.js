import SidebarLayout from "./SidebarLayout";
import { FiBarChart2, FiBriefcase, FiSettings, FiUserCheck, FiUsers } from "react-icons/fi";

const AdminLayout = () => {
  const navItems = [
    { label: "Dashboard", path: "/admin/dashboard", end: true, icon: <FiBarChart2 /> },
    { label: "Manage HR", path: "/admin/hrs", icon: <FiBriefcase /> },
    { label: "Employees", path: "/admin/employees", icon: <FiUsers /> },
    { label: "Candidates", path: "/admin/candidates", icon: <FiUserCheck /> },
    { label: "Reports", path: "/admin/reports", icon: <FiBarChart2 /> },
    { label: "Settings", path: "/admin/settings", icon: <FiSettings /> },
  ];

  return <SidebarLayout title="Super Admin" navItems={navItems} variant="admin" />;
};

export default AdminLayout;
