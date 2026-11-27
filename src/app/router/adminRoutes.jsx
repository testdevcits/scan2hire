import { Navigate, Route, Routes } from "react-router-dom";
import { USER_ROLES } from "../../constants/roles";
import { ROUTES } from "../../constants/routes";
import ProtectedRoute from "./ProtectedRoute";
import AdminLayout from "../../components/layout/AdminLayout";
import DocumentSigningList from "../../features/documents/components/DocumentSigningList";
import AdminDashboard from "../../features/dashboard/pages/AdminDashboard";
import ManageEmployees from "../../features/employees/pages/ManageEmployees";
import EmployeeCreate from "../../features/employees/pages/EmployeeCreate";
import EmployeeDetail from "../../features/employees/pages/EmployeeDetail";
import ViewReports from "../../features/reports/pages/ViewReports";
import TodayCheckIns from "../../features/attendance/TodayCheckIns";
import LeaveReports from "../../features/leave/pages/LeaveReports";
import Candidates from "../../features/candidates/pages/Candidates";
import CandidateDetail from "../../features/candidates/pages/CandidateDetail";
import EmployeeCredentials from "../../features/settings/pages/EmployeeCredentials";
import AdminSettings from "../../features/settings/pages/AdminSettings";
import ManageHR from "../../features/settings/pages/ManageHR";
import Departments from "../../features/settings/pages/Departments";
import EmployeeAccessControl from "../../features/settings/pages/EmployeeAccessControl";
import EmployeeModuleAccess from "../../features/settings/pages/EmployeeModuleAccess";
import AuditLogs from "../../features/settings/pages/AuditLogs";
import SystemAllotments from "../../features/system-allotments/SystemAllotments";
import Notifications from "../../features/notifications/Notifications";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route
        path={ROUTES.ADMIN}
        element={
          <ProtectedRoute allowedRoles={[USER_ROLES.SUPERADMIN]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="hrs" element={<ManageHR />} />
        <Route path="departments" element={<Departments />} />
        <Route path="employees" element={<ManageEmployees />} />
        <Route
          path="employee-documents"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.HR, USER_ROLES.SUPERADMIN]}>
              <DocumentSigningList managed />
            </ProtectedRoute>
          }
        />
        <Route path="employees/new" element={<EmployeeCreate />} />
        <Route path="employees/:employeeId/edit" element={<EmployeeCreate />} />
        <Route path="employees/:employeeId" element={<EmployeeDetail />} />
        <Route path="candidates" element={<Candidates />} />
        <Route path="candidates/:candidateId" element={<CandidateDetail />} />
        <Route path="reports" element={<ViewReports />} />
        <Route path="today-checkins" element={<TodayCheckIns />} />
        <Route path="leave-reports" element={<LeaveReports />} />
        <Route path="credentials" element={<EmployeeCredentials />} />
        <Route path="roles-access" element={<EmployeeAccessControl />} />
        <Route path="employee-module-access" element={<EmployeeModuleAccess />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="system-allotments" element={<SystemAllotments />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route
          path="leave-settings"
          element={<Navigate to="/admin/settings?tab=leave" replace />}
        />
        <Route path="notifications" element={<Notifications />} />
      </Route>
    </Routes>
  );
}
