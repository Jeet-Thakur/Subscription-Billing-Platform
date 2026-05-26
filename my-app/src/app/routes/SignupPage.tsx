import { Navigate } from "react-router-dom";

function SignupPage() {
  return <Navigate to="/auth?mode=organization-signup" replace />;
}

export default SignupPage;