import { useContext } from "react";
import SidebarLayout from "./SidebarLayout";
import { FiBarChart2, FiCalendar, FiClock, FiFileText, FiFolder, FiLock, FiMonitor, FiSettings } from "react-icons/fi";
import { AuthContext } from "../contexts/AuthContext";

const EmployeeLayout = () => {
  const { user } = useContext(AuthContext);
  const navItems = [
    { label: "Dashboard", path: "/employee/dashboard", end: true, icon: <FiBarChart2 /> },
    { label: "Attendance", path: "/employee/attendance", icon: <FiClock /> },
    { label: "Leaves", path: "/employee/leaves", icon: <FiCalendar /> },
    { label: "Leave Calendar", path: "/employee/leave-calendar", icon: <FiCalendar /> },
    ...(user?.role === "teamlead"
      ? [{ label: "Leave Reports", path: "/hr/leave-reports", icon: <FiCalendar /> }]
      : []),
    { label: "Interviews", path: "/employee/candidates", icon: <FiFileText /> },
    { label: "System Allotments", path: "/employee/system-allotments", icon: <FiMonitor /> },
    { label: "Documents", path: "/employee/documents", icon: <FiFolder /> },
    { label: "Credentials", path: "/employee/credentials", icon: <FiLock /> },
    { label: "Settings", path: "/employee/settings", icon: <FiSettings /> },
  ];

  return <SidebarLayout title={user?.role === "teamlead" ? "Team Lead Panel" : "Employee Panel"} navItems={navItems} />;
};

export default EmployeeLayout;
