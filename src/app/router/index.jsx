import { BrowserRouter } from "react-router-dom";
import AdminRoutes from "./adminRoutes";
import EmployeeRoutes from "./employeeRoutes";
import HRRoutes from "./hrRoutes";
import PublicRoutes from "./publicRoutes";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <PublicRoutes />
      <AdminRoutes />
      <HRRoutes />
      <EmployeeRoutes />
    </BrowserRouter>
  );
}
