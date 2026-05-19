import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import DashboardPage from "../../features/dashboard/components/DashboardPage";
import ProtectedRoute from "../../components/layout/ProtectedRoute";

import LoginPage from "./LoginPage";
import SignupPage from "./SignupPage";

function AppRoutes() {
  return (

      <Routes>
        <Route
            path="/"
            element={<Navigate to="/login" replace />}
          />
        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/signup"
          element={<SignupPage />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
  );
}

export default AppRoutes;