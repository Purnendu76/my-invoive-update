import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getUserRole } from "../lib/utils/getUserRole";

type PrivateRouteProps = {
  children: ReactNode;
  allowedRoles?: Array<"Admin" | "user">;
};

export default function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const role = getUserRole();

  // ✅ If no token/role, go to login *immediately*
  if (!role) return <Navigate to="/" replace />;

  // ✅ If role not allowed, block
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
