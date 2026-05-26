import { Navigate } from "react-router-dom";

function LoginPage() {
  return <Navigate to="/auth?mode=customer-login" replace />;
}

export default LoginPage;