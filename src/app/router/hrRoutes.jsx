import { Navigate, Route, Routes } from "react-router-dom";
import { USER_ROLES } from "../../constants/roles";
import { ROUTES } from "../../constants/routes";
import ProtectedRoute from "./ProtectedRoute";
import HRLayout from "../../components/layout/HRLayout";
import EmployeeDashboard from "../../features/dashboard/pages/EmployeeDashboard";
import HRDashboard from "../../features/dashboard/pages/HRDashboard";
import DocumentSigningList from "../../features/documents/components/DocumentSigningList";
import ManageEmployees from "../../features/employees/pages/ManageEmployees";
import EmployeeCreate from "../../features/employees/pages/EmployeeCreate";
import EmployeeDetail from "../../features/employees/pages/EmployeeDetail";
import EmployeeLeaveCalendar from "../../features/leave/pages/EmployeeLeaveCalendar";
import ViewReports from "../../features/reports/pages/ViewReports";
import TodayCheckIns from "../../features/attendance/TodayCheckIns";
import LeaveReports from "../../features/leave/pages/LeaveReports";
import EmployeeCredentials from "../../features/settings/pages/EmployeeCredentials";
import EmployeeAccessControl from "../../features/settings/pages/EmployeeAccessControl";
import SystemAllotments from "../../features/system-allotments/SystemAllotments";
import Candidates from "../../features/candidates/pages/Candidates";
import CandidateDetail from "../../features/candidates/pages/CandidateDetail";
import EmployeeSettings from "../../features/settings/pages/EmployeeSettings";
import Notifications from "../../features/notifications/Notifications";

export default function HRRoutes() {
  return (
    <Routes>
      <Route
        path={ROUTES.HR}
        element={
          <ProtectedRoute
            allowedRoles={[USER_ROLES.HR, USER_ROLES.TEAM_LEAD, USER_ROLES.PROJECT_COORDINATOR]}
          >
            <HRLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" />} />
        <Route path="dashboard" element={<HRDashboard />} />
        <Route path="employees" element={<ManageEmployees />} />
        <Route
          path="employee-documents"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.HR, USER_ROLES.SUPERADMIN]}>
              <DocumentSigningList managed />
            </ProtectedRoute>
          }
        />
        <Route path="my-documents" element={<DocumentSigningList />} />
        <Route path="employees/list" element={<ManageEmployees />} />
        <Route path="employees/new" element={<EmployeeCreate />} />
        <Route path="employees/:employeeId/edit" element={<EmployeeCreate />} />
        <Route path="employees/:employeeId" element={<EmployeeDetail />} />
        <Route path="attendance" element={<EmployeeDashboard section="attendance" />} />
        <Route path="leave-calendar" element={<EmployeeLeaveCalendar />} />
        <Route path="tasks" element={<Navigate to="dashboard" replace />} />
        <Route path="task-sheet" element={<Navigate to="dashboard" replace />} />
        <Route path="bugs" element={<Navigate to="dashboard" replace />} />
        <Route path="reports" element={<ViewReports />} />
        <Route path="today-checkins" element={<TodayCheckIns />} />
        <Route path="leave-reports" element={<LeaveReports />} />
        <Route path="credentials" element={<EmployeeCredentials />} />
        <Route path="manage-tl" element={<EmployeeAccessControl />} />
        <Route path="system-allotments" element={<SystemAllotments />} />
        <Route path="candidates/list" element={<Candidates />} />
        <Route path="candidates/:candidateId" element={<CandidateDetail />} />
        <Route path="settings" element={<EmployeeSettings />} />
        <Route path="profile" element={<EmployeeSettings requireProfileAccess />} />
        <Route path="documents" element={<Navigate to="settings" replace />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
    </Routes>
  );
}
