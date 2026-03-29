import { Navigate } from "react-router";
import { useAuth } from "@/contexts/auth-context";

interface RoleRouteProps {
  allow: Array<"admin" | "staff" | "rider">;
  children: React.ReactNode;
}

export default function RoleRoute({ allow, children }: RoleRouteProps) {
  const { isAdmin, isStaff, isRider } = useAuth();
  const ok =
    (allow.includes("admin") && isAdmin) ||
    (allow.includes("staff") && isStaff) ||
    (allow.includes("rider") && isRider);

  if (!ok) return <Navigate to="/orders" replace />;
  return <>{children}</>;
}
