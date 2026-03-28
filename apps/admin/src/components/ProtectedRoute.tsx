import { Navigate } from "react-router";
import { useAuth } from "@/contexts/auth-context";
import Spinner from "./Spinner";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isStaff, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!isAuthenticated || !isStaff) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
