import { useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, token, logout } = useContext(AuthContext);
  const location = useLocation(); // detects page change
  const [isAllowed, setIsAllowed] = useState(true);

  useEffect(() => {
    // 1️⃣ If no token or user -> logout
    if (!token || !user) {
      logout();
      setIsAllowed(false);
      return;
    }

    try {
      // 2️⃣ Decode JWT
      const decoded = jwtDecode(token);
      const now = Date.now() / 1000;

      if (decoded.exp && decoded.exp < now) {
        // Token expired
        logout();
        setIsAllowed(false);
        return;
      }

      // 3️⃣ Check role
      const roleClaims = [user.role, user.workRole, user.effectiveRole].filter(Boolean);
      if (allowedRoles.length > 0 && !roleClaims.some((role) => allowedRoles.includes(role))) {
        setIsAllowed(false);
      } else {
        setIsAllowed(true);
      }
    } catch (err) {
      console.error("Invalid token:", err);
      logout();
      setIsAllowed(false);
    }
  }, [location.pathname, token, user, logout, allowedRoles]);

  if (!isAllowed) {
    // Redirect to login or unauthorized
    if (!user) return <Navigate to="/login" replace />;
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
