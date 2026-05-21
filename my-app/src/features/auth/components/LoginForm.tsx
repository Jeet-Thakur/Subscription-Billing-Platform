import { Navigate } from "react-router-dom";

function LoginForm() {
  return <Navigate to="/auth?mode=admin-login" replace />;
}

export default LoginForm;