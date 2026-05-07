import { useContext } from "react";
import { FiBarChart2, FiCalendar, FiFolder, FiLock, FiMonitor, FiShield, FiUser, FiUserCheck, FiUsers } from "react-icons/fi";
import { AuthContext } from "../contexts/AuthContext";
import SidebarLayout from "./SidebarLayout";

const HRLayout = () => {
  const { user } = useContext(AuthContext);
  const isTeamLead = user?.role === "teamlead";
  const navItems = [
    { label: "Dashboard", path: "/hr/dashboard", end: true, icon: <FiBarChart2 /> },
    { label: "Employees", path: "/hr/employees", icon: <FiUsers /> },
    { label: "Candidates", path: "/hr/candidates/list", icon: <FiUserCheck /> },
    { label: "Attendance Reports", path: "/hr/reports", icon: <FiCalendar /> },
    { label: "Leave Reports", path: "/hr/leave-reports", icon: <FiCalendar /> },
    { label: "System Allotments", path: "/hr/system-allotments", icon: <FiMonitor /> },
    { label: "Credentials", path: "/hr/credentials", icon: <FiLock /> },
    ...(isTeamLead ? [{ label: "Manage TL", path: "/hr/manage-tl", icon: <FiShield /> }] : []),
    { label: "Documents", path: "/hr/documents", icon: <FiFolder /> },
    { label: "Profile", path: "/hr/profile", icon: <FiUser /> },
  ];

  return <SidebarLayout title={isTeamLead ? "Team Lead Panel" : "HR Panel"} navItems={navItems} />;
};

export default HRLayout;
