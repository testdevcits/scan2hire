import SidebarLayout from "./SidebarLayout";
import { FiBarChart2, FiCalendar, FiClock, FiFileText, FiUser } from "react-icons/fi";

const EmployeeLayout = () => {
  const navItems = [
    { label: "Dashboard", path: "/employee/dashboard", end: true, icon: <FiBarChart2 /> },
    { label: "Profile", path: "/employee/profile", icon: <FiUser /> },
    { label: "Attendance", path: "/employee/attendance", icon: <FiClock /> },
    { label: "Leaves", path: "/employee/leaves", icon: <FiCalendar /> },
    { label: "Interviews", path: "/employee/candidates", icon: <FiFileText /> },
  ];

  return <SidebarLayout title="Employee Panel" navItems={navItems} />;
};

export default EmployeeLayout;
