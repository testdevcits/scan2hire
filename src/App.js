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
import HRLayout from "./layouts/HRLayout"; // New HR layout with sidebar
import HRDashboard from "./pages/hr/HRDashboard";
import ManageEmployees from "./pages/hr/ManageEmployees";
import ViewReports from "./pages/hr/ViewReports";
import PostJobs from "./pages/hr/PostJobs";
import ThankYouPage from "./pages/ThankYouPage";
import Candidates from "./pages/hr/Candidates/Candidates";

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

        {/* Protected Admin Dashboard */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["superadmin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected HR routes using HRLayout */}
        <Route
          path="/hr/*"
          element={
            <ProtectedRoute allowedRoles={["hr"]}>
              <HRLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<HRDashboard />} />
          <Route path="employees" element={<ManageEmployees />} />
          <Route path="reports" element={<ViewReports />} />
          <Route path="jobs" element={<PostJobs />} />{" "}
          <Route path="candidates/list" element={<Candidates />} />
        </Route>

        {/* Unauthorized route */}
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Routes>
    </Router>
  );
}

export default App;
