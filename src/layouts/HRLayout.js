import { useContext, useEffect, useState } from "react";
import { FiAlertTriangle, FiBarChart2, FiCalendar, FiCheckSquare, FiClock, FiFolder, FiLock, FiMonitor, FiShield, FiUser, FiUserCheck, FiUsers } from "react-icons/fi";
import { AuthContext } from "../contexts/AuthContext";
import SidebarLayout from "./SidebarLayout";
import { employeeApi } from "../api";

const HRLayout = () => {
  const { user } = useContext(AuthContext);
  const isTeamLead = (user?.effectiveRole || user?.role) === "teamlead";
  const isHr = user?.role === "hr";
  const [access, setAccess] = useState(null);

  useEffect(() => {
    let active = true;
    if (!isTeamLead) {
      setAccess(null);
      return undefined;
    }

    employeeApi
      .getMyAccess()
      .then((res) => {
        if (active) setAccess(res.data.data || {});
      })
      .catch(() => {
        if (active) setAccess({});
      });

    return () => {
      active = false;
    };
  }, [isTeamLead]);

  const canViewSystemAllotments = isHr || Boolean(access?.systemAllotment);

  const navItems = [
    { label: "Dashboard", path: "/hr/dashboard", end: true, icon: <FiBarChart2 /> },
    ...(isTeamLead ? [{ label: "Attendance", path: "/employee/attendance", icon: <FiClock /> }] : []),
    { label: isTeamLead ? "Your Team" : "Employees", path: "/hr/employees", icon: <FiUsers /> },
    { label: "Tasks", path: "/hr/tasks", icon: <FiCheckSquare /> },
    { label: "Bugs", path: "/hr/bugs", icon: <FiAlertTriangle /> },
    { label: "Candidates", path: "/hr/candidates/list", icon: <FiUserCheck /> },
    { label: "Today Check-ins", path: "/hr/today-checkins", icon: <FiClock /> },
    { label: "Attendance Reports", path: "/hr/reports", icon: <FiCalendar /> },
    { label: "Leave Reports", path: "/hr/leave-reports", icon: <FiCalendar /> },
    ...(canViewSystemAllotments
      ? [{ label: "System Allotments", path: "/hr/system-allotments", icon: <FiMonitor /> }]
      : []),
    { label: "Credentials", path: "/hr/credentials", icon: <FiLock /> },
    ...(isHr ? [{ label: "Roles & Access", path: "/hr/manage-tl", icon: <FiShield /> }] : []),
    { label: "Documents", path: "/hr/documents", icon: <FiFolder /> },
    { label: "Profile", path: "/hr/profile", icon: <FiUser /> },
  ];

  return <SidebarLayout title={isTeamLead ? "Team Lead Panel" : "HR Panel"} navItems={navItems} />;
};

export default HRLayout;
