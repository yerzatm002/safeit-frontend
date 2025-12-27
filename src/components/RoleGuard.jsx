import { Navigate } from "react-router-dom";
import { getUser } from "../utils/token";

export default function RoleGuard({ allowedRoles = [], children }) {
  const user = getUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // если роль не совпадает → редирект в "свой" dashboard
  if (!allowedRoles.includes(user.role)) {
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
