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
import ThankYouPage from "./pages/ThankYouPage";
import Candidates from "./pages/hr/Candidates/Candidates";
import CandidateDetail from "./pages/hr/Candidates/CandidateDetail";
import EmployeeDetail from "./pages/hr/Employees/EmployeeDetail";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployeeForgotPassword from "./pages/EmployeeForgotPassword";
import AdminSettings from "./pages/admin/AdminSettings";

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<Home />} />

        {/* Public QR form page */}
        <Route path="/form/:qrId" element={<FormPage />} />

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
          <Route path="hrs" element={<AdminDashboard />} />
          <Route path="employees" element={<ManageEmployees />} />
          <Route path="employees/:employeeId" element={<EmployeeDetail />} />
          <Route path="candidates" element={<Candidates />} />
          <Route path="candidates/:candidateId" element={<CandidateDetail />} />
          <Route path="reports" element={<ViewReports />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Protected HR routes using HRLayout */}
        <Route
          path="/hr/*"
          element={
            <ProtectedRoute allowedRoles={["hr", "superadmin"]}>
              <HRLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<HRDashboard />} />
          <Route path="employees" element={<ManageEmployees />} />
          <Route path="employees/list" element={<ManageEmployees />} />
          <Route path="employees/:employeeId" element={<EmployeeDetail />} />
          <Route path="reports" element={<ViewReports />} />
          <Route path="candidates/list" element={<Candidates />} />
          <Route path="candidates/:candidateId" element={<CandidateDetail />} />
        </Route>

        <Route
          path="/employee/*"
          element={
            <ProtectedRoute allowedRoles={["employee"]}>
              <EmployeeLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<EmployeeDashboard section="all" />} />
          <Route path="attendance" element={<EmployeeDashboard section="attendance" />} />
          <Route path="leaves" element={<EmployeeDashboard section="leaves" />} />
          <Route path="documents" element={<EmployeeDashboard section="documents" />} />
          <Route path="candidates" element={<EmployeeDashboard section="candidates" />} />
        </Route>

        {/* Unauthorized route */}
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Routes>
    </Router>
  );
}

export default App;
