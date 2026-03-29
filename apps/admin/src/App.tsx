import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider } from "@/contexts/auth-context";
import ProtectedRoute from "@/components/ProtectedRoute";
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
import RidersPage from "@/pages/RidersPage";
import PromosPage from "@/pages/PromosPage";
import NotificationsPage from "@/pages/NotificationsPage";
import DeliveryFeesPage from "@/pages/DeliveryFeesPage";

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
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />

            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />

            <Route path="inventory" element={<InventoryPage />} />
            <Route path="inventory/new" element={<ProductFormPage />} />
            <Route path="inventory/:id" element={<ProductFormPage />} />

            <Route path="shipments" element={<ShipmentsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="riders" element={<RidersPage />} />
            <Route path="promos" element={<PromosPage />} />
            <Route path="delivery-fees" element={<DeliveryFeesPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
