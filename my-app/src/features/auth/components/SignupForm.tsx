import { useState } from "react";

import { signupUser } from "../services/authService";

import type { ApiErrorResponse } from "../services/authService";
import { setAccessToken } from "../../../utils/auth";

function SignupForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] =
    useState<ApiErrorResponse | null>(null);

  const [successMessage, setSuccessMessage] =
    useState("");

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setSuccessMessage("");

    try {
      const response = await signupUser({
        username,
        password,
      });

      setAccessToken(response.access_token);

      setSuccessMessage(
        "Account created successfully"
      );

      setUsername("");
      setPassword("");
    } catch (err: unknown) {
      const apiError = err as ApiErrorResponse;

      setError(apiError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 rounded-xl border p-6 shadow">
      <h2 className="mb-6 text-2xl font-bold">
        Signup
      </h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">
            Username
          </label>

          <input
            type="text"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2"
            placeholder="Enter username"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2"
            placeholder="Enter password"
            required
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-100 p-3 text-sm text-red-600">
            <p>{error.detail}</p>

            {error.info && (
              <p className="mt-1">
                {error.info}
              </p>
            )}
          </div>
        )}

        {successMessage && (
          <div className="rounded-lg bg-green-100 p-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black px-4 py-2 text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading
            ? "Creating account..."
            : "Signup"}
        </button>
      </form>
    </div>
  );
}

export default SignupForm;