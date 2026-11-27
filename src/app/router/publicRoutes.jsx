import { Navigate, Route, Routes } from "react-router-dom";
import { ROUTES } from "../../constants/routes";
import Home from "../../features/dashboard/pages/Home";
import FormPage from "../../features/candidates/pages/FormPage";
import Login from "../../features/auth/pages/Login";
import OtpPage from "../../features/auth/pages/OtpPage";
import Signup from "../../features/auth/pages/Signup";
import ThankYouPage from "../../features/auth/pages/ThankYouPage";
import Unauthorized from "../../features/auth/pages/Unauthorized";
import EmployeeForgotPassword from "../../features/auth/pages/EmployeeForgotPassword";

export default function PublicRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<Home />} />
      <Route path={ROUTES.CANDIDATE_FORM} element={<FormPage />} />
      <Route
        path={ROUTES.CANDIDATE_FORM_WITH_QR}
        element={<Navigate to={ROUTES.CANDIDATE_FORM} replace />}
      />
      <Route path={ROUTES.OTP} element={<OtpPage />} />
      <Route path={ROUTES.THANK_YOU} element={<ThankYouPage />} />
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.SIGNUP} element={<Signup />} />
      <Route path={ROUTES.EMPLOYEE_FORGOT_PASSWORD} element={<EmployeeForgotPassword />} />
      <Route path={ROUTES.UNAUTHORIZED} element={<Unauthorized />} />
    </Routes>
  );
}
