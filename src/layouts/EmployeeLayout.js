import { useContext, useEffect, useState } from "react";
import SidebarLayout from "./SidebarLayout";
import { FiBarChart2, FiBriefcase, FiCalendar, FiClock, FiFolder, FiLock, FiMonitor, FiSettings } from "react-icons/fi";
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
    ...(!access.moduleAccess || access.moduleAccess.dashboard?.view !== false ? [{ label: "Dashboard", path: "/employee/dashboard", end: true, icon: <FiBarChart2 /> }] : []),
    ...(!access.moduleAccess || access.moduleAccess.attendance?.view !== false ? [{ label: "Attendance", path: "/employee/attendance", icon: <FiClock /> }] : []),
    ...(!access.moduleAccess || access.moduleAccess.interviews?.view !== false ? [{ label: "Interviews", path: "/employee/interviews", icon: <FiBriefcase /> }] : []),
    // { label: "Tasks", path: "/employee/tasks", icon: <FiCheckSquare /> },
    ...(!access.moduleAccess || access.moduleAccess.leaves?.view !== false ? [{ label: "Leaves", path: "/employee/leaves", icon: <FiCalendar /> }] : []),
    ...(!access.moduleAccess || access.moduleAccess.systemAllotment?.view !== false ? [{ label: "My System", path: "/employee/my-system", icon: <FiMonitor /> }] : []),
    ...(access.systemAllotmentManage && (!access.moduleAccess || access.moduleAccess.systemAllotment?.view !== false)
      ? [{ label: "System Allotments", path: "/employee/system-allotments", icon: <FiMonitor /> }]
      : []),
    ...(!access.moduleAccess || access.moduleAccess.documents?.view !== false ? [{ label: "Documents", path: "/employee/documents", icon: <FiFolder /> }] : []),
    ...(!access.moduleAccess || access.moduleAccess.credentials?.view !== false ? [{ label: "Credentials", path: "/employee/credentials", icon: <FiLock /> }] : []),
    ...(!access.moduleAccess || access.moduleAccess.settings?.view !== false ? [{ label: "Settings", path: "/employee/settings", icon: <FiSettings /> }] : []),
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
