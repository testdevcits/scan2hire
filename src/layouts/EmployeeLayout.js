/* eslint-disable */
import { useApi } from "../contexts/ApiContext";
import { useContext, useEffect, useState } from "react";
import SidebarLayout from "./SidebarLayout";
import { FiBarChart2, FiBriefcase, FiCalendar, FiClock, FiFolder, FiLock, FiMonitor, FiSettings } from "react-icons/fi";
import { AuthContext } from "../contexts/AuthContext";

const EmployeeLayout = () => {
  const { employeeApi } = useApi();
  const { user } = useContext(AuthContext);
  const [access, setAccess] = useState({});
  const [accessLoading, setAccessLoading] = useState(true);

  useEffect(() => {
    let active = true;
    employeeApi
      .getMyAccess()
      .then((res) => {
        if (active) setAccess(res.data.data || {});
      })
      .catch(() => {
        if (active) setAccess({});
      })
      .finally(() => {
        if (active) setAccessLoading(false);
      });
    return () => {
      active = false;
    };
  }, [employeeApi]);

  const navItems = accessLoading ? [
    { label: "Dashboard", path: "/employee/dashboard", end: true, icon: <FiBarChart2 /> },
  ] : [
    ...(access.moduleAccess?.dashboard?.view === true ? [{ label: "Dashboard", path: "/employee/dashboard", end: true, icon: <FiBarChart2 /> }] : []),
    ...(access.moduleAccess?.attendance?.view === true ? [{ label: "Attendance", path: "/employee/attendance", icon: <FiClock /> }] : []),
    ...(access.moduleAccess?.interviews?.view === true ? [{ label: "Interviews", path: "/employee/interviews", icon: <FiBriefcase /> }] : []),
    // { label: "Tasks", path: "/employee/tasks", icon: <FiCheckSquare /> },
    ...(access.moduleAccess?.leaves?.view === true ? [{ label: "Leaves", path: "/employee/leaves", icon: <FiCalendar /> }] : []),
    ...(access.moduleAccess?.leaveCalendar?.view === true ? [{ label: "Conative Calendar", path: "/employee/leave-calendar", icon: <FiCalendar /> }] : []),
    ...(access.moduleAccess?.systemAllotment?.view === true ? [{ label: "My System", path: "/employee/my-system", icon: <FiMonitor /> }] : []),
    ...(access.systemAllotmentManage && (access.moduleAccess?.systemAllotment?.view === true)
      ? [{ label: "System Allotments", path: "/employee/system-allotments", icon: <FiMonitor /> }]
      : []),
    ...((access.moduleAccess?.documents?.view === true || access.moduleAccess?.profileDocuments?.view === true) ? [{ label: "Documents", path: "/employee/documents", icon: <FiFolder /> }] : []),
    ...(access.moduleAccess?.credentials?.view === true ? [{ label: "Credentials", path: "/employee/credentials", icon: <FiLock /> }] : []),
    ...(access.moduleAccess?.settings?.view === true ? [{ label: "Settings", path: "/employee/settings", icon: <FiSettings /> }] : []),
  ];

  const effectiveRole = user?.effectiveRole || user?.role;
  const title = effectiveRole === "teamlead"
    ? "Team Lead Panel"
    : effectiveRole === "project_coordinator"
    ? "Project Coordinator Panel"
    : "Employee Panel";

  const canOpenProfile = !accessLoading && access.moduleAccess?.profile?.view === true;
  return <SidebarLayout title={title} navItems={navItems} navLoading={accessLoading} canOpenProfile={canOpenProfile} />;
};

export default EmployeeLayout;
