import { useContext, useEffect, useState } from "react";
import SidebarLayout from "./SidebarLayout";
import { FiAlertTriangle, FiBarChart2, FiCalendar, FiCheckSquare, FiClock, FiCode, FiFileText, FiFolder, FiLock, FiMonitor, FiSettings } from "react-icons/fi";
import { AuthContext } from "../contexts/AuthContext";
import { employeeApi } from "../api";

const EmployeeLayout = () => {
  const { user } = useContext(AuthContext);
  const [access, setAccess] = useState(null);
  const [bugCount, setBugCount] = useState(0);

  useEffect(() => {
    let active = true;
    if (!["employee", "teamlead"].includes(user?.role)) return undefined;

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
  }, [user?.role]);

  useEffect(() => {
    let active = true;
    if (!["employee", "teamlead"].includes(user?.role)) return undefined;

    employeeApi
      .getBugs()
      .then((res) => {
        if (!active) return;
        const count = (res.data.data || []).filter((bug) =>
          ["open", "in_progress", "reopen"].includes(bug.status)
        ).length;
        setBugCount(count);
      })
      .catch(() => {
        if (active) setBugCount(0);
      });

    return () => {
      active = false;
    };
  }, [user?.role]);

  const navItems = [
    { label: "Dashboard", path: "/employee/dashboard", end: true, icon: <FiBarChart2 /> },
    { label: "My Tasks", path: "/employee/tasks", icon: <FiCheckSquare /> },
    { label: "Bugs", path: "/employee/bugs", icon: <FiAlertTriangle />, badge: bugCount },
    { label: "API Tester", path: "/employee/api-tester", icon: <FiCode /> },
    { label: "Attendance", path: "/employee/attendance", icon: <FiClock /> },
    { label: "Leaves", path: "/employee/leaves", icon: <FiCalendar /> },
    { label: "Leave Calendar", path: "/employee/leave-calendar", icon: <FiCalendar /> },
    ...((user?.effectiveRole || user?.role) === "teamlead"
      ? [{ label: "Leave Reports", path: "/hr/leave-reports", icon: <FiCalendar /> }]
      : []),
    { label: "Interviews", path: "/employee/candidates", icon: <FiFileText /> },
    ...(access?.systemAllotment
      ? [{ label: "System Allotments", path: "/employee/system-allotments", icon: <FiMonitor /> }]
      : []),
    { label: "Documents", path: "/employee/documents", icon: <FiFolder /> },
    { label: "Credentials", path: "/employee/credentials", icon: <FiLock /> },
    { label: "Settings", path: "/employee/settings", icon: <FiSettings /> },
  ];

  return <SidebarLayout title={(user?.effectiveRole || user?.role) === "teamlead" ? "Team Lead Panel" : "Employee Panel"} navItems={navItems} />;
};

export default EmployeeLayout;
