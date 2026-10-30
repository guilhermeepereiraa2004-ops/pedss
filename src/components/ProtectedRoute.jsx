import { Navigate, useLocation } from "react-router-dom";
import useApplication from "../hooks/useApplication";
export default function ProtectedRoute({ central = false, children }) {
  const { identity } = useApplication();
  const location = useLocation();
  if (!identity)
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  if (central && identity.role !== "admin") return <Navigate to="/acesso-negado" replace />;
  return children;
}
