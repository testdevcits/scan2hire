import { useContext, useEffect, useState } from "react";
import { FiBarChart2, FiCalendar, FiClock, FiLock, FiMonitor, FiSettings, FiShield, FiUserCheck, FiUsers } from "react-icons/fi";
import { AuthContext } from "../contexts/AuthContext";
import SidebarLayout from "./SidebarLayout";
import { employeeApi } from "../api";
import API from "../api/axios";

const HRLayout = () => {
  const { user } = useContext(AuthContext);
  const roleClaims = [user?.role, user?.workRole, user?.effectiveRole].filter(Boolean);
  const hasRole = (role) => roleClaims.includes(role);
  const isTeamLead = hasRole("teamlead");
  const isProjectCoordinator = hasRole("project_coordinator");
  const isHr = user?.role === "hr";
  const [access, setAccess] = useState(null);

  useEffect(() => {
    let active = true;
    if (!user) {
      setAccess(null);
      return undefined;
    }
    const request = isTeamLead ? employeeApi.getMyAccess() : API.get('/users/me');
    request
      .then((res) => {
        if (!active) return;
        const data = res.data.data || {};
        setAccess(isTeamLead ? { modules: data.moduleAccess || null, ...data } : data.moduleAccess === null ? null : { modules: data.moduleAccess });
      })
      .catch(() => {
        if (active) setAccess({});
      });

    return () => {
      active = false;
    };
  }, [isTeamLead, user]);

  const moduleAllowed = (key) => (isHr || isTeamLead) && (access === null || access?.modules === null || (typeof access?.modules?.[key] === 'object' ? access.modules[key].view !== false : access?.modules?.[key] !== false));
  const canViewSystemAllotments = isHr || isTeamLead ? moduleAllowed(isTeamLead ? 'systemAllotment' : 'systemAllotments') : Boolean(access?.systemAllotment);

  const panelTitle = isProjectCoordinator
    ? "Project Coordinator Panel"
    : isTeamLead
    ? "Team Lead Panel"
    : "HR Panel";

  const navItems = [
    ...(!isProjectCoordinator && moduleAllowed('dashboard')
      ? [{ label: "Dashboard", path: "/hr/dashboard", end: true, icon: <FiBarChart2 /> }]
      : []),
    ...(isTeamLead ? [{ label: "Attendance", path: "/hr/attendance", icon: <FiClock /> }] : []),
    ...(isTeamLead ? [{ label: "Conative Calendar", path: "/hr/leave-calendar", icon: <FiCalendar /> }] : []),
    // Task module is temporarily hidden.
    // { label: "Tasks", path: "/hr/tasks", icon: <FiCheckSquare /> },
    ...(!isProjectCoordinator && moduleAllowed(isTeamLead ? 'yourTeam' : 'employees')
      ? [{ label: isTeamLead ? "Your Team" : "Employees", path: "/hr/employees", icon: <FiUsers /> }]
      : []),
    ...(!isProjectCoordinator && moduleAllowed('candidates') ? [{ label: "Candidates", path: "/hr/candidates/list", icon: <FiUserCheck /> }] : []),
    ...(!isProjectCoordinator && moduleAllowed('checkins') ? [{ label: "Today Check-ins", path: "/hr/today-checkins", icon: <FiClock /> }] : []),
    ...(!isProjectCoordinator && moduleAllowed('attendanceReports') ? [{ label: "Attendance Reports", path: "/hr/reports", icon: <FiCalendar /> }] : []),
    ...(!isProjectCoordinator && moduleAllowed('leaveReports') ? [{ label: "Leave Reports", path: "/hr/leave-reports", icon: <FiCalendar /> }] : []),
    ...(canViewSystemAllotments
      ? [{ label: "System Allotments", path: "/hr/system-allotments", icon: <FiMonitor /> }]
      : []),
    ...(moduleAllowed('credentials') ? [{ label: "Credentials", path: "/hr/credentials", icon: <FiLock /> }] : []),
    ...(moduleAllowed('rolesAccess') ? [{ label: "Roles & Access", path: "/hr/manage-tl", icon: <FiShield /> }] : []),
    { label: "Settings", path: "/hr/settings", icon: <FiSettings /> },
  ];

  return <SidebarLayout title={panelTitle} navItems={navItems} />;
};

export default HRLayout;
