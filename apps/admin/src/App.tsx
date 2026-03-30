import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider } from "@/contexts/auth-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleRoute from "@/components/RoleRoute";
import AdminLayout from "@/components/AdminLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import OrdersPage from "@/pages/OrdersPage";
import OrderDetailPage from "@/pages/OrderDetailPage";
import InventoryPage from "@/pages/InventoryPage";
import ProductFormPage from "@/pages/ProductFormPage";
import ShipmentsPage from "@/pages/ShipmentsPage";
import CustomersPage from "@/pages/CustomersPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import PromosPage from "@/pages/PromosPage";
import DeliveryFeesPage from "@/pages/DeliveryFeesPage";
import StaffManagementPage from "@/pages/StaffManagementPage";
import StaffDetailPage from "@/pages/StaffDetailPage";
import InStorePurchasePage from "@/pages/InStorePurchasePage";
import { useAuth } from "@/contexts/auth-context";

function HomeRedirect() {
  const { isAdmin, isRider, isStaff } = useAuth();
  if (isAdmin) return <Navigate to="/dashboard" replace />;
  if (isStaff) return <Navigate to="/dashboard" replace />;
  if (isRider) return <Navigate to="/orders" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomeRedirect />} />
            <Route path="dashboard" element={<RoleRoute allow={["admin", "staff"]}><DashboardPage /></RoleRoute>} />

            <Route path="orders" element={<RoleRoute allow={["admin", "staff", "rider"]}><OrdersPage /></RoleRoute>} />
            <Route path="orders/:id" element={<RoleRoute allow={["admin", "staff", "rider"]}><OrderDetailPage /></RoleRoute>} />

            <Route path="inventory" element={<RoleRoute allow={["admin", "staff"]}><InventoryPage /></RoleRoute>} />
            <Route path="inventory/new" element={<RoleRoute allow={["admin"]}><ProductFormPage /></RoleRoute>} />
            <Route path="inventory/:id" element={<RoleRoute allow={["admin"]}><ProductFormPage /></RoleRoute>} />
            <Route path="in-store" element={<RoleRoute allow={["admin", "staff"]}><InStorePurchasePage /></RoleRoute>} />

            <Route path="shipments" element={<RoleRoute allow={["admin"]}><ShipmentsPage /></RoleRoute>} />
            <Route path="customers" element={<RoleRoute allow={["admin"]}><CustomersPage /></RoleRoute>} />
            <Route path="analytics" element={<RoleRoute allow={["admin"]}><AnalyticsPage /></RoleRoute>} />
            <Route path="staff-access" element={<RoleRoute allow={["admin"]}><StaffManagementPage /></RoleRoute>} />
            <Route path="staff-access/:id" element={<RoleRoute allow={["admin"]}><StaffDetailPage /></RoleRoute>} />
            <Route path="promos" element={<RoleRoute allow={["admin"]}><PromosPage /></RoleRoute>} />
            <Route path="delivery-fees" element={<RoleRoute allow={["admin"]}><DeliveryFeesPage /></RoleRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
