import { useContext, useEffect, useState } from "react";
import SidebarLayout from "./SidebarLayout";
import { FiBarChart2, FiCalendar, FiCheckSquare, FiClock, FiFolder, FiLock, FiMonitor, FiSettings } from "react-icons/fi";
import { AuthContext } from "../contexts/AuthContext";
import { employeeApi } from "../api";

const EmployeeLayout = () => {
  const { user } = useContext(AuthContext);
  const [access, setAccess] = useState({});

  useEffect(() => {
    let active = true;
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
  }, []);

  const navItems = [
    { label: "Dashboard", path: "/employee/dashboard", end: true, icon: <FiBarChart2 /> },
    { label: "Attendance", path: "/employee/attendance", icon: <FiClock /> },
    { label: "Tasks", path: "/employee/tasks", icon: <FiCheckSquare /> },
    { label: "Leaves", path: "/employee/leaves", icon: <FiCalendar /> },
    { label: "Conative Calendar", path: "/employee/leave-calendar", icon: <FiCalendar /> },
    { label: "My System", path: "/employee/my-system", icon: <FiMonitor /> },
    ...(access.systemAllotmentManage
      ? [{ label: "System Allotments", path: "/employee/system-allotments", icon: <FiMonitor /> }]
      : []),
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
