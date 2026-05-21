import { Navigate, Route, Routes } from "react-router-dom";

import DashboardPage from "../../features/dashboard/components/DashboardPage";
import ProtectedRoute from "../../components/layout/ProtectedRoute";

import AuthPage from "./AuthPage";
import LoginPage from "./LoginPage";
import SignupPage from "./SignupPage";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}

export default AppRoutes;