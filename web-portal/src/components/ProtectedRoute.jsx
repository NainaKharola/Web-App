import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../auth/useAdminAuth";

function ProtectedRoute({ children }) {
  const { checking, authenticated } = useAdminAuth();
  const location = useLocation();

  if (checking) return null;
  if (!authenticated) {
    return <Navigate replace to="/admin/login" state={{ from: location }} />;
  }

  return children;
}

export default ProtectedRoute;

export function PublicAdminRoute({ children }) {
  const { checking, authenticated } = useAdminAuth();

  if (checking) return null;
  if (authenticated) return <Navigate replace to="/admin/dashboard" />;

  return children;
}
