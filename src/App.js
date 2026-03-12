import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import FormPage from "./pages/FormPage";
import OtpPage from "./pages/OtpPage";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";

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
        {/* Admin Login */}
        <Route path="/login" element={<Login />} />
        {/* Protected Admin Dashboard */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
