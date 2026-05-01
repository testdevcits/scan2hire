import { FiBarChart2, FiCalendar, FiUserCheck, FiUsers } from "react-icons/fi";
import SidebarLayout from "./SidebarLayout";

const HRLayout = () => {
  const navItems = [
    { label: "Dashboard", path: "/hr/dashboard", end: true, icon: <FiBarChart2 /> },
    { label: "Employees", path: "/hr/employees", icon: <FiUsers /> },
    { label: "Candidates", path: "/hr/candidates/list", icon: <FiUserCheck /> },
    { label: "Reports & Calendar", path: "/hr/reports", icon: <FiCalendar /> },
  ];

  return <SidebarLayout title="HR Panel" navItems={navItems} />;
};

export default HRLayout;
