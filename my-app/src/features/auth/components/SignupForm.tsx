import { Navigate } from "react-router-dom";

function SignupForm() {
  return <Navigate to="/auth?mode=organization-signup" replace />;
}

export default SignupForm;