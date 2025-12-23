import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getUserRole } from "../lib/utils/getUserRole";

type PrivateRouteProps = {
  children: ReactNode;
  allowedRoles?: Array<"Admin" | "user">;
};

import { useLocation } from "react-router-dom";

export default function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const role = getUserRole();
  // const location = useLocation();

  // ✅ If no token/role, go to login *immediately*
  if (!role) return <Navigate to="/" replace />;

  // ✅ If role not allowed, block
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  // ✅ If user is authenticated/authorized and at '/', redirect to '/dashboard-2'
  // if (location.pathname === "") {
  //   return <Navigate to="/dashboard-2" replace />;
  // }

  return <>{children}</>;
}
