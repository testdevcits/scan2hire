import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AdminContext } from "../contexts/AdminContext";

const ProtectedRoute = ({ children }) => {
  const { admin } = useContext(AdminContext);

  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
