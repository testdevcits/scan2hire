import { Navigate, Route, Routes } from "react-router-dom";
import { USER_ROLES } from "../../constants/roles";
import { ROUTES } from "../../constants/routes";
import ProtectedRoute from "./ProtectedRoute";
import EmployeeLayout from "../../components/layout/EmployeeLayout";
import EmployeeDashboard from "../../features/dashboard/pages/EmployeeDashboard";
import EmployeeSettings from "../../features/settings/pages/EmployeeSettings";
import EmployeeDocuments from "../../features/documents/EmployeeDocuments";
import EmployeeSavedCredentials from "../../features/settings/pages/EmployeeSavedCredentials";
import SystemAllotments from "../../features/system-allotments/SystemAllotments";
import EmployeeLeaveCalendar from "../../features/leave/pages/EmployeeLeaveCalendar";
import Notifications from "../../features/notifications/Notifications";

export default function EmployeeRoutes() {
  return (
    <Routes>
      <Route
        path={ROUTES.EMPLOYEE}
        element={
          <ProtectedRoute
            allowedRoles={[
              USER_ROLES.EMPLOYEE,
              USER_ROLES.TEAM_LEAD,
              USER_ROLES.PROJECT_COORDINATOR,
            ]}
          >
            <EmployeeLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard" element={<EmployeeDashboard section="all" />} />
        <Route path="settings" element={<EmployeeSettings />} />
        <Route path="profile" element={<EmployeeSettings requireProfileAccess />} />
        <Route path="documents" element={<EmployeeDocuments />} />
        <Route path="credentials" element={<EmployeeSavedCredentials />} />
        <Route path="attendance" element={<EmployeeDashboard section="attendance" />} />
        <Route path="interviews" element={<EmployeeDashboard section="candidates" />} />
        <Route path="tasks" element={<Navigate to="dashboard" replace />} />
        <Route path="my-system" element={<SystemAllotments selfOnly />} />
        <Route path="system-allotments" element={<SystemAllotments />} />
        <Route path="leaves" element={<EmployeeDashboard section="leaves" />} />
        <Route path="leave-calendar" element={<EmployeeLeaveCalendar />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
