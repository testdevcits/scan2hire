import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Home from "./pages/Home";
import FormPage from "./pages/FormPage";
import OtpPage from "./pages/OtpPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import Unauthorized from "./pages/Unauthorized";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLayout from "./layouts/AdminLayout";
import HRLayout from "./layouts/HRLayout"; // New HR layout with sidebar
import EmployeeLayout from "./layouts/EmployeeLayout";
import HRDashboard from "./pages/hr/HRDashboard";
import ManageEmployees from "./pages/hr/ManageEmployees";
import ViewReports from "./pages/hr/ViewReports";
import TodayCheckIns from "./pages/hr/TodayCheckIns";
import LeaveReports from "./pages/hr/LeaveReports";
import ThankYouPage from "./pages/ThankYouPage";
import Candidates from "./pages/hr/Candidates/Candidates";
import CandidateDetail from "./pages/hr/Candidates/CandidateDetail";
import EmployeeDetail from "./pages/hr/Employees/EmployeeDetail";
import EmployeeCredentials from "./pages/hr/EmployeeCredentials";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployeeForgotPassword from "./pages/EmployeeForgotPassword";
import AdminSettings from "./pages/admin/AdminSettings";
import ManageHR from "./pages/admin/ManageHR";
import EmployeeAccessControl from "./pages/admin/EmployeeAccessControl";
import SystemAllotments from "./pages/SystemAllotments";
import UserProfile from "./pages/UserProfile";
import EmployeeSettings from "./pages/employee/EmployeeSettings";
import EmployeeSavedCredentials from "./pages/employee/EmployeeSavedCredentials";
import EmployeeDocuments from "./pages/employee/EmployeeDocuments";
import EmployeeLeaveCalendar from "./pages/employee/EmployeeLeaveCalendar";
import TaskManagement from "./pages/hr/TaskManagement";
import EmployeeTasks from "./pages/employee/EmployeeTasks";

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<Home />} />

        {/* Public QR form page */}
        <Route path="/form" element={<FormPage />} />
        <Route path="/form/:qrId" element={<Navigate to="/form" replace />} />

        {/* OTP verification page */}
        <Route path="/otp" element={<OtpPage />} />
        <Route path="/thankyou" element={<ThankYouPage />} />

        {/* Auth pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/employee/forgot-password" element={<EmployeeForgotPassword />} />

        {/* Protected Admin Dashboard */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["superadmin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="hrs" element={<ManageHR />} />
          <Route path="employees" element={<ManageEmployees />} />
          <Route path="employees/:employeeId" element={<EmployeeDetail />} />
          <Route path="candidates" element={<Candidates />} />
          <Route path="candidates/:candidateId" element={<CandidateDetail />} />
          <Route path="reports" element={<ViewReports />} />
          <Route path="today-checkins" element={<TodayCheckIns />} />
          <Route path="leave-reports" element={<LeaveReports />} />
          <Route path="credentials" element={<EmployeeCredentials />} />
          <Route path="system-allotments" element={<SystemAllotments />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Protected HR routes using HRLayout */}
        <Route
          path="/hr/*"
          element={
            <ProtectedRoute allowedRoles={["hr", "teamlead"]}>
              <HRLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<HRDashboard />} />
          <Route path="employees" element={<ManageEmployees />} />
          <Route path="employees/list" element={<ManageEmployees />} />
          <Route path="employees/:employeeId" element={<EmployeeDetail />} />
          <Route path="tasks" element={<TaskManagement />} />
          <Route path="reports" element={<ViewReports />} />
          <Route path="today-checkins" element={<TodayCheckIns />} />
          <Route path="leave-reports" element={<LeaveReports />} />
          <Route path="credentials" element={<EmployeeCredentials />} />
          <Route path="manage-tl" element={<EmployeeAccessControl />} />
          <Route path="system-allotments" element={<SystemAllotments />} />
          <Route path="candidates/list" element={<Candidates />} />
          <Route path="candidates/:candidateId" element={<CandidateDetail />} />
          <Route path="documents" element={<UserProfile title="Documents" />} />
          <Route path="profile" element={<UserProfile />} />
        </Route>

        <Route
          path="/employee/*"
          element={
            <ProtectedRoute allowedRoles={["employee", "teamlead"]}>
              <EmployeeLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<EmployeeDashboard section="all" />} />
          <Route path="settings" element={<EmployeeSettings />} />
          <Route path="documents" element={<EmployeeDocuments />} />
          <Route path="credentials" element={<EmployeeSavedCredentials />} />
          <Route path="attendance" element={<EmployeeDashboard section="attendance" />} />
          <Route path="leaves" element={<EmployeeDashboard section="leaves" />} />
          <Route path="leave-calendar" element={<EmployeeLeaveCalendar />} />
          <Route path="tasks" element={<EmployeeTasks />} />
          <Route path="candidates" element={<EmployeeDashboard section="candidates" />} />
          <Route path="system-allotments" element={<SystemAllotments />} />
        </Route>

        {/* Unauthorized route */}
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Routes>
    </Router>
  );
}

export default App;
