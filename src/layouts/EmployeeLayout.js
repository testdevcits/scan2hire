import { useContext } from "react";
import SidebarLayout from "./SidebarLayout";
import { FiBarChart2, FiCalendar, FiClock, FiFolder, FiLock, FiMonitor, FiSettings } from "react-icons/fi";
import { AuthContext } from "../contexts/AuthContext";

const EmployeeLayout = () => {
  const { user } = useContext(AuthContext);

  const navItems = [
    { label: "Dashboard", path: "/employee/dashboard", end: true, icon: <FiBarChart2 /> },
    { label: "Attendance", path: "/employee/attendance", icon: <FiClock /> },
    { label: "Leaves", path: "/employee/leaves", icon: <FiCalendar /> },
    { label: "Conative Calendar", path: "/employee/leave-calendar", icon: <FiCalendar /> },
    { label: "My System", path: "/employee/system-allotments", icon: <FiMonitor /> },
    { label: "Documents", path: "/employee/documents", icon: <FiFolder /> },
    { label: "Credentials", path: "/employee/credentials", icon: <FiLock /> },
    { label: "Settings", path: "/employee/settings", icon: <FiSettings /> },
  ];

  const effectiveRole = user?.effectiveRole || user?.role;
  const title = effectiveRole === "teamlead"
    ? "Team Lead Panel"
    : effectiveRole === "project_coordinator"
    ? "Project Coordinator Panel"
    : "Employee Panel";

  return <SidebarLayout title={title} navItems={navItems} />;
};

export default EmployeeLayout;
