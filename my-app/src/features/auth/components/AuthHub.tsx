import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  loginAdmin,
  loginCustomer,
  registerCustomer,
  signupOrganization,
  type ApiErrorResponse,
} from "../services/authService";

import { setAccessToken } from "../../../utils/auth";

type AuthMode =
  | "organization-signup"
  | "admin-login"
  | "customer-login"
  | "customer-register";

type FormState = {
  organizationName: string;
  organizationSlug: string;
  organizationBillingEmail: string;
  organizationStripeAccountId: string;
  email: string;
  password: string;
  role: string;
  customerName: string;
  customerEmail: string;
  customerPassword: string;
};

type FieldConfig = {
  key: keyof FormState;
  label: string;
  placeholder: string;
  type?: "text" | "email" | "password";
  autoComplete?: string;
  helperText?: string;
};

type ModeConfig = {
  title: string;
  description: string;
  submitLabel: string;
  successMessage: string;
  redirectToDashboard?: boolean;
  fields: FieldConfig[];
};

const initialFormState: FormState = {
  organizationName: "",
  organizationSlug: "",
  organizationBillingEmail: "",
  organizationStripeAccountId: "",
  email: "",
  password: "",
  role: "admin",
  customerName: "",
  customerEmail: "",
  customerPassword: "",
};

const modeOptions: Array<{ key: AuthMode; label: string }> = [
  { key: "customer-login", label: "Customer login" },
  { key: "admin-login", label: "User login" },
];

const modeConfig: Record<AuthMode, ModeConfig> = {
  "organization-signup": {
    title: "Organization signup",
    description: "Create the organization and the first admin account in one step.",
    submitLabel: "Create organization",
    successMessage: "Organization created. Token stored.",
    redirectToDashboard: true,
    fields: [
      {
        key: "organizationName",
        label: "Organization name",
        placeholder: "Northwind Labs",
        autoComplete: "organization",
      },
      {
        key: "organizationSlug",
        label: "Organization slug",
        placeholder: "northwind-labs",
        helperText: "Used in the backend as the unique organization key.",
      },
      {
        key: "organizationBillingEmail",
        label: "Billing email",
        placeholder: "billing@northwind.com",
        type: "email",
        autoComplete: "email",
      },
      {
        key: "organizationStripeAccountId",
        label: "Stripe account ID",
        placeholder: "acct_...",
        helperText: "Optional.",
      },
      {
        key: "email",
        label: "Admin email",
        placeholder: "admin@northwind.com",
        type: "email",
        autoComplete: "email",
      },
      {
        key: "password",
        label: "Admin password",
        placeholder: "Enter password",
        type: "password",
        autoComplete: "new-password",
      },
    ],
  },
  "admin-login": {
    title: "Admin login",
    description: "Sign in with an existing admin account.",
    submitLabel: "Sign in",
    successMessage: "Admin token stored.",
    redirectToDashboard: true,
    fields: [
      {
        key: "email",
        label: "Email",
        placeholder: "admin@northwind.com",
        type: "email",
        autoComplete: "email",
      },
      {
        key: "password",
        label: "Password",
        placeholder: "Enter password",
        type: "password",
        autoComplete: "current-password",
      },
    ],
  },
  "customer-login": {
    title: "Customer login",
    description: "Sign in with a customer account.",
    submitLabel: "Sign in",
    successMessage: "Customer token stored.",
    redirectToDashboard: true,
    fields: [
      {
        key: "customerEmail",
        label: "Email",
        placeholder: "customer@example.com",
        type: "email",
        autoComplete: "email",
      },
      {
        key: "customerPassword",
        label: "Password",
        placeholder: "Enter password",
        type: "password",
        autoComplete: "current-password",
      },
    ],
  },
  "customer-register": {
    title: "Customer register",
    description: "Create a customer account and store the token immediately.",
    submitLabel: "Create customer",
    successMessage: "Customer created. Token stored.",
    redirectToDashboard: true,
    fields: [
      {
        key: "customerName",
        label: "Name",
        placeholder: "Jordan Lee",
        autoComplete: "name",
      },
      {
        key: "customerEmail",
        label: "Email",
        placeholder: "customer@example.com",
        type: "email",
        autoComplete: "email",
      },
      {
        key: "customerPassword",
        label: "Password",
        placeholder: "Enter password",
        type: "password",
        autoComplete: "new-password",
      },
    ],
  },
};

function getInitialMode(value: string | null): AuthMode {
  if (value === "admin-login") {
    return "admin-login";
  }

  if (value === "customer-login") {
    return "customer-login";
  }

  if (value === "customer-register") {
    return "customer-register";
  }

  if (value === "organization-signup") {
    return "organization-signup";
  }

  return "customer-login";
}

function AuthHub() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(() => getInitialMode(searchParams.get("mode")));
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiErrorResponse | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const nextMode = getInitialMode(searchParams.get("mode"));

    if (nextMode !== mode) {
      setMode(nextMode);
    }
  }, [mode, searchParams]);

  const config = useMemo(() => modeConfig[mode], [mode]);

  const updateField = (
    key: keyof FormState,
    value: string
  ) => {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const selectMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setSearchParams({ mode: nextMode }, { replace: true });
    setError(null);
    setSuccessMessage("");
  };

  const storeTokenAndFinish = (token: string, redirectToDashboard?: boolean) => {
    setAccessToken(token);

    if (redirectToDashboard) {
      navigate("/dashboard");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);
    setError(null);
    setSuccessMessage("");

    try {
      if (mode === "organization-signup") {
        const response = await signupOrganization({
          organization: {
            name: formState.organizationName,
            slug: formState.organizationSlug,
            billing_email: formState.organizationBillingEmail,
            stripe_account_id: formState.organizationStripeAccountId || null,
          },
          user: {
            email: formState.email,
            password: formState.password,
          },
        });

        storeTokenAndFinish(response.access_token, config.redirectToDashboard);
        setSuccessMessage(config.successMessage);
        return;
      }

      if (mode === "admin-login") {
        const response = await loginAdmin({
          email: formState.email,
          password: formState.password,
        });

        storeTokenAndFinish(response.access_token, config.redirectToDashboard);
        setSuccessMessage(config.successMessage);
        return;
      }

      if (mode === "customer-login") {
        const response = await loginCustomer({
          email: formState.customerEmail,
          password: formState.customerPassword,
        });

        storeTokenAndFinish(response.access_token, config.redirectToDashboard);
        setSuccessMessage(config.successMessage);
        return;
      }

      const response = await registerCustomer({
        email: formState.customerEmail,
        password: formState.customerPassword,
        name: formState.customerName,
      });

      storeTokenAndFinish(response.access_token, config.redirectToDashboard);
      setSuccessMessage(config.successMessage);
    } catch (submissionError) {
      setError(submissionError as ApiErrorResponse);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-slate-50 text-slate-900">
      <div className="grid min-h-screen w-full lg:grid-cols-2">
        <aside className="flex flex-col justify-center gap-10 bg-slate-900 p-8 text-white lg:p-12 xl:p-16">
        <div className="mx-auto w-full max-w-xl space-y-8">
            <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                SaaS Billing Platform
            </p>

            <h1 className="max-w-lg text-3xl font-semibold tracking-tight sm:text-4xl">
                Manage subscriptions, payments, and organizations in one place.
            </h1>

            <p className="max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                Authenticate organizations, admins, and customers securely.
                Track subscriptions, generate invoices, and manage billing workflows
                with a centralized platform built for scalable SaaS products.
            </p>
            </div>

            {/* <div className="grid gap-4 text-sm text-slate-300 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                Organization Management
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                Secure Authentication
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                Subscription Billing
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                Automated Invoice Generation
            </div>
            </div> */}
        </div>

        {/* <p className="text-sm text-slate-400">
            Built for multi-tenant SaaS systems with role-based access and billing automation.
        </p> */}
        </aside>

        <section className="flex items-center p-6 sm:p-8 lg:p-10 xl:p-16">
          <div className="w-full max-w-2xl space-y-10">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                Select mode
              </p>
              <div className="flex flex-wrap gap-3">
                {modeOptions.map((option) => {
                  const active = option.key === mode;

                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => selectMode(option.key)}
                      className={`rounded-full border px-5 py-3 text-sm leading-none transition ${
                        active
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                {config.title}
              </h2>
              <p className="text-sm leading-7 text-slate-500">
                {config.description}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {config.fields.map((field) => (
                <label key={String(field.key)} className="block space-y-3">
                  <span className="text-sm font-medium text-slate-700">
                    {field.label}
                  </span>
                  <input
                    type={field.type ?? "text"}
                    value={formState[field.key]}
                    onChange={(event) => updateField(field.key, event.target.value)}
                    placeholder={field.placeholder}
                    autoComplete={field.autoComplete}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                  {field.helperText ? (
                    <span className="block text-xs leading-6 text-slate-400">
                      {field.helperText}
                    </span>
                  ) : null}
                </label>
              ))}

              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
                  <p className="font-medium">{error.detail}</p>
                  {error.info ? <p className="mt-2 leading-6 text-rose-600">{error.info}</p> : null}
                </div>
              ) : null}

              {successMessage ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
                  {successMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-slate-900 px-5 py-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Please wait..." : config.submitLabel}
              </button>

              {mode === "customer-login" ? (
                <button
                  type="button"
                  onClick={() => selectMode("customer-register")}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  New here? Sign up
                </button>
              ) : null}

              {mode === "customer-register" ? (
                <button
                  type="button"
                  onClick={() => selectMode("customer-login")}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Already have an account? Log in
                </button>
              ) : null}

              {mode === "admin-login" ? (
                <button
                  type="button"
                  onClick={() => selectMode("organization-signup")}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Register organization
                </button>
              ) : null}

              {mode === "organization-signup" ? (
                <button
                  type="button"
                  onClick={() => selectMode("admin-login")}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Back to user login
                </button>
              ) : null}
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

export default AuthHub;