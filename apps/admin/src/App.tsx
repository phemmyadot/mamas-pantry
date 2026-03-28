import { BrowserRouter, Routes, Route, Navigate } from "react-router";

// Placeholder — pages will be built in the admin phase
function Dashboard() {
  return (
    <div className="min-h-screen bg-forest-deep flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-cream mb-2">Mama&apos;s Pantry</h1>
        <p className="text-forest-pale text-sm">Admin Dashboard — coming soon</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
