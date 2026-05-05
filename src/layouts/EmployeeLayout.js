import SidebarLayout from "./SidebarLayout";
import { FiBarChart2, FiCalendar, FiClock, FiFileText, FiLock, FiSettings } from "react-icons/fi";

const EmployeeLayout = () => {
  const navItems = [
    { label: "Dashboard", path: "/employee/dashboard", end: true, icon: <FiBarChart2 /> },
    { label: "Attendance", path: "/employee/attendance", icon: <FiClock /> },
    { label: "Leaves", path: "/employee/leaves", icon: <FiCalendar /> },
    { label: "Interviews", path: "/employee/candidates", icon: <FiFileText /> },
    { label: "Credentials", path: "/employee/credentials", icon: <FiLock /> },
    { label: "Settings", path: "/employee/settings", icon: <FiSettings /> },
  ];

  return <SidebarLayout title="Employee Panel" navItems={navItems} />;
};

export default EmployeeLayout;
