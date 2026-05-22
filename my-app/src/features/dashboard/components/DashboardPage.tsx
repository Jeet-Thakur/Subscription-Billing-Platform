import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  activatePlan,
  createPlan,
  deactivatePlan,
  getOrganizationPlans,
  type ApiErrorResponse as PlanApiErrorResponse,
  type Plan,
  type PlanCreateRequest,
  type PlanUpdateRequest,
  updatePlan,
} from "../services/planService";
import { registerAdmin, type UserRegistrationRequest } from "../../auth/services/authService";
import {
  getDashboardSummary,
  type DashboardSummary,
} from "../services/dashboardService";
import {
  getActiveSubscriptions,
  getCancelledSubscriptions,
  getExpiringSubscriptions,
  getOrganizationSubscriptions,
  getSubscriptionById,
  type ApiErrorResponse as SubscriptionApiErrorResponse,
  type OrganizationSubscription,
} from "../services/subscriptionService";

import CustomerDashboard from "./CustomerDashboard";

import { getAccessTokenClaims, removeAccessToken } from "../../../utils/auth";

type AuthContext = {
  actorType: string;
  email?: string;
  role?: string;
  organizationId?: string;
};

type PlanFormState = {
  name: string;
  description: string;
  billing_interval: string;
  price: string;
  currency: string;
  trial_days: string;
};

type SubscriptionFilter = {
  status: "all" | "active" | "cancelled" | "expiring";
  expiringDays: string;
  planId: string;
  customerId: string;
};

type DashboardTab = "summary" | "plans" | "subscriptions";

const emptyFormState: PlanFormState = {
  name: "",
  description: "",
  billing_interval: "monthly",
  price: "",
  currency: "USD",
  trial_days: "",
};

const emptySubscriptionFilter: SubscriptionFilter = {
  status: "all",
  expiringDays: "7",
  planId: "",
  customerId: "",
};

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatCurrency(amount: string, currency: string) {
  const parsedAmount = Number(amount);

  if (Number.isNaN(parsedAmount)) {
    return `${currency} ${amount}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(parsedAmount);
}

function DashboardPage() {
  const navigate = useNavigate();
  const [authContext, setAuthContext] = useState<AuthContext | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>("summary");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [subscriptions, setSubscriptions] = useState<OrganizationSubscription[]>([]);
  const [selectedSubscription, setSelectedSubscription] = useState<OrganizationSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(false);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(false);
  const [showCreateAdminForm, setShowCreateAdminForm] = useState(false);
  const [adminFormState, setAdminFormState] = useState({
    email: "",
    password: "",
    role: "admin",
  });
  const [adminCreating, setAdminCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<PlanApiErrorResponse | SubscriptionApiErrorResponse | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planFormState, setPlanFormState] = useState<PlanFormState>(emptyFormState);
  const [subscriptionFilter, setSubscriptionFilter] = useState<SubscriptionFilter>(emptySubscriptionFilter);
  const [subscriptionLookupId, setSubscriptionLookupId] = useState("");
  const [searchingSubscription, setSearchingSubscription] = useState(false);

  const isAdminArea = authContext?.actorType !== "customer";

  const loadSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const data = await getDashboardSummary();
      setDashboardSummary(data);
    } catch (summaryError) {
      setError(summaryError as PlanApiErrorResponse);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const loadPlans = useCallback(async () => {
    try {
      setPlansLoading(true);
      const data = await getOrganizationPlans();
      setPlans(data);
    } catch (planError) {
      setError(planError as PlanApiErrorResponse);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  const loadSubscriptions = useCallback(async () => {
    try {
      setSubscriptionsLoading(true);

      let data: OrganizationSubscription[];

      if (subscriptionFilter.status === "active") {
        data = await getActiveSubscriptions();
      } else if (subscriptionFilter.status === "cancelled") {
        data = await getCancelledSubscriptions();
      } else if (subscriptionFilter.status === "expiring") {
        data = await getExpiringSubscriptions(Number(subscriptionFilter.expiringDays) || 7);
      } else {
        data = await getOrganizationSubscriptions({
          plan_id: subscriptionFilter.planId.trim() || undefined,
          customer_id: subscriptionFilter.customerId.trim() || undefined,
        });
      }

      setSubscriptions(data);
    } catch (subscriptionError) {
      setError(subscriptionError as SubscriptionApiErrorResponse);
    } finally {
      setSubscriptionsLoading(false);
    }
  }, [subscriptionFilter.customerId, subscriptionFilter.expiringDays, subscriptionFilter.planId, subscriptionFilter.status]);

  useEffect(() => {
    const claims = getAccessTokenClaims();

    if (!claims) {
      navigate("/auth", { replace: true });
      return;
    }

    setAuthContext({
      actorType: claims.actor_type ?? "unknown",
      email: claims.email,
      role: claims.role,
      organizationId: claims.organization_id,
    });

    if (claims.actor_type !== "customer") {
      void loadSummary();
      void loadPlans();
      void loadSubscriptions();
    } else {
      setLoading(false);
    }
  }, [loadPlans, loadSummary, loadSubscriptions, navigate]);

  useEffect(() => {
    if (!authContext || authContext.actorType === "customer") {
      return;
    }

    if (activeTab === "summary") {
      void loadSummary();
    }

    if (activeTab === "plans") {
      void loadPlans();
    }

    if (activeTab === "subscriptions") {
      void loadSubscriptions();
    }
  }, [activeTab, authContext, loadPlans, loadSummary, loadSubscriptions]);

  useEffect(() => {
    if (authContext && authContext.actorType !== "customer") {
      setLoading(summaryLoading || plansLoading || subscriptionsLoading);
    }
  }, [authContext, plansLoading, summaryLoading, subscriptionsLoading]);

  const sortedPlans = useMemo(() => {
    return [...plans].sort((left, right) => {
      if (left.is_active === right.is_active) {
        return left.name.localeCompare(right.name);
      }

      return left.is_active ? -1 : 1;
    });
  }, [plans]);

  const subscriptionSummary = useMemo(() => {
    return {
      total: subscriptions.length,
      active: subscriptions.filter((item) => item.status === "active").length,
      cancelled: subscriptions.filter((item) => item.status === "cancelled").length,
    };
  }, [subscriptions]);

  const resetPlanForm = () => {
    setEditingPlanId(null);
    setPlanFormState(emptyFormState);
  };

  const selectPlanForEdit = (plan: Plan) => {
    setEditingPlanId(plan.id);
    setPlanFormState({
      name: plan.name,
      description: plan.description ?? "",
      billing_interval: plan.billing_interval,
      price: plan.price,
      currency: plan.currency,
      trial_days: plan.trial_days?.toString() ?? "",
    });
    setActiveTab("plans");
  };

  const handleLogout = () => {
    removeAccessToken();
    navigate("/auth", { replace: true });
  };

  const handleCreateAdmin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAdminArea) {
      return;
    }

    setAdminCreating(true);
    setError(null);
    setSuccessMessage("");

    try {
      const payload: UserRegistrationRequest = {
        email: adminFormState.email.trim(),
        password: adminFormState.password,
        role: adminFormState.role.trim() || "admin",
      };

      await registerAdmin(payload);

      setSuccessMessage("Admin created.");
      setAdminFormState({
        email: "",
        password: "",
        role: "admin",
      });
      setShowCreateAdminForm(false);
    } catch (createAdminError) {
      setError(createAdminError as PlanApiErrorResponse);
    } finally {
      setAdminCreating(false);
    }
  };

  const handlePlanSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAdminArea) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage("");

    try {
      const payload: PlanCreateRequest = {
        name: planFormState.name.trim(),
        description: planFormState.description.trim() || null,
        billing_interval: planFormState.billing_interval.trim().toLowerCase(),
        price: planFormState.price.trim(),
        currency: planFormState.currency.trim().toUpperCase(),
        trial_days: planFormState.trial_days.trim() ? Number(planFormState.trial_days) : null,
      };

      if (editingPlanId) {
        const updatePayload: PlanUpdateRequest = {
          ...payload,
        };

        await updatePlan(editingPlanId, updatePayload);
        setSuccessMessage("Plan updated.");
      } else {
        await createPlan(payload);
        setSuccessMessage("Plan created.");
      }

      resetPlanForm();
      await loadPlans();
      await loadSummary();
    } catch (submitError) {
      setError(submitError as PlanApiErrorResponse);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePlanStatus = async (plan: Plan) => {
    setActionLoadingId(plan.id);
    setError(null);
    setSuccessMessage("");

    try {
      if (plan.is_active) {
        await deactivatePlan(plan.id);
        setSuccessMessage("Plan deactivated.");
      } else {
        await activatePlan(plan.id);
        setSuccessMessage("Plan activated.");
      }

      await loadPlans();
      await loadSummary();
    } catch (actionError) {
      setError(actionError as PlanApiErrorResponse);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSubscriptionFilterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await loadSubscriptions();
  };

  const handleSubscriptionLookup = async () => {
    if (!subscriptionLookupId.trim()) {
      return;
    }

    setSearchingSubscription(true);
    setError(null);

    try {
      const subscription = await getSubscriptionById(subscriptionLookupId.trim());
      setSelectedSubscription(subscription);
      setActiveTab("subscriptions");
    } catch (lookupError) {
      setError(lookupError as SubscriptionApiErrorResponse);
    } finally {
      setSearchingSubscription(false);
    }
  };

  if (loading && !authContext) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
        <div className="mx-auto max-w-6xl text-sm text-slate-500">Loading dashboard...</div>
      </main>
    );
  }

  if (authContext?.actorType === "customer") {
    return <CustomerDashboard authContext={authContext} onLogout={handleLogout} />;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Dashboard</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {activeTab === "summary" ? "Organization Summary" : activeTab === "plans" ? "Organization Plans" : "Organization Subscriptions"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {authContext?.email ? `${authContext.email}${authContext.role ? ` • ${authContext.role}` : ""}` : "Authenticated session"}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {isAdminArea ? (
              <button
                type="button"
                onClick={() => setShowCreateAdminForm((current) => !current)}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                {showCreateAdminForm ? "Close create admin" : "Create admin"}
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </header>

        {isAdminArea && showCreateAdminForm ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Create admin</h2>
              <p className="mt-1 text-sm text-slate-500">
                Create a new admin from inside the dashboard.
              </p>
            </div>

            <form onSubmit={handleCreateAdmin} className="grid gap-4 sm:grid-cols-3">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <input
                  type="email"
                  value={adminFormState.email}
                  onChange={(event) =>
                    setAdminFormState((current) => ({ ...current, email: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  placeholder="new.admin@company.com"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Password</span>
                <input
                  type="password"
                  value={adminFormState.password}
                  onChange={(event) =>
                    setAdminFormState((current) => ({ ...current, password: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  placeholder="Enter password"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Role</span>
                <input
                  value={adminFormState.role}
                  onChange={(event) =>
                    setAdminFormState((current) => ({ ...current, role: event.target.value }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  placeholder="admin"
                />
              </label>

              <div className="flex flex-wrap gap-3 sm:col-span-3">
                <button
                  type="submit"
                  disabled={adminCreating}
                  className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {adminCreating ? "Creating..." : "Create admin"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowCreateAdminForm(false)}
                  className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        ) : null}

        <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
          {([
            ["summary", "Summary"],
            ["plans", "Plans"],
            ["subscriptions", "Subscriptions"],
          ] as const).map(([tabKey, label]) => {
            const isActive = activeTab === tabKey;

            return (
              <button
                key={tabKey}
                type="button"
                onClick={() => setActiveTab(tabKey)}
                className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

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

        {activeTab === "summary" ? (
          <div className="space-y-6">
            {summaryLoading ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">Loading summary...</div>
            ) : null}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Total subscriptions", value: dashboardSummary?.total_subscriptions_count ?? 0 },
                { label: "Active subscriptions", value: dashboardSummary?.active_subscriptions_count ?? 0 },
                { label: "Cancelled subscriptions", value: dashboardSummary?.cancelled_subscriptions_count ?? 0 },
                { label: "Monthly recurring revenue", value: dashboardSummary ? `${dashboardSummary.monthly_recurring_revenue}` : "0" },
              ].map((item) => (
                <article key={item.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{item.value}</p>
                </article>
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Revenue by plan</h2>
                <div className="mt-4 space-y-3">
                  {(dashboardSummary?.revenue_by_plan ?? []).length === 0 ? (
                    <p className="text-sm text-slate-500">No revenue data.</p>
                  ) : (
                    dashboardSummary?.revenue_by_plan.map((item) => (
                      <div key={item.plan_id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium text-slate-900">{item.plan_name}</p>
                          <p className="text-xs text-slate-500">{item.currency}</p>
                        </div>
                        <p className="font-semibold text-slate-900">{formatCurrency(item.revenue, item.currency)}</p>
                      </div>
                    ))
                  )}
                </div>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Subscriptions by plan</h2>
                <div className="mt-4 space-y-3">
                  {(dashboardSummary?.subscription_count_by_plan ?? []).length === 0 ? (
                    <p className="text-sm text-slate-500">No subscription data.</p>
                  ) : (
                    dashboardSummary?.subscription_count_by_plan.map((item) => (
                      <div key={item.plan_id} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm">
                        <p className="font-medium text-slate-900">{item.plan_name}</p>
                        <p className="font-semibold text-slate-900">{item.subscription_count}</p>
                      </div>
                    ))
                  )}
                </div>
              </article>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Recent subscriptions</h2>
              <div className="mt-4 space-y-3">
                {(dashboardSummary?.recent_subscriptions ?? []).length === 0 ? (
                  <p className="text-sm text-slate-500">No recent subscriptions.</p>
                ) : (
                  dashboardSummary?.recent_subscriptions.map((item) => (
                    <div key={item.subscription_id} className="grid gap-2 rounded-2xl border border-slate-200 px-4 py-4 text-sm md:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Customer</p>
                        <p className="mt-1 font-medium text-slate-900">{item.customer_name}</p>
                        <p className="text-xs text-slate-500">{item.customer_email}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Plan</p>
                        <p className="mt-1 font-medium text-slate-900">{item.plan_name}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Status</p>
                        <p className="mt-1 font-medium text-slate-900">{item.status}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Created</p>
                        <p className="mt-1 font-medium text-slate-900">{formatDate(item.created_at)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        ) : null}

        {activeTab === "plans" ? (
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-slate-900">
                  {editingPlanId ? "Edit plan" : "Create plan"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">Manage organization plans with the backend schema.</p>
              </div>

              <form onSubmit={handlePlanSubmit} className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Name</span>
                  <input
                    value={planFormState.name}
                    onChange={(event) => setPlanFormState((current) => ({ ...current, name: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    placeholder="Starter"
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Description</span>
                  <textarea
                    value={planFormState.description}
                    onChange={(event) => setPlanFormState((current) => ({ ...current, description: event.target.value }))}
                    className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    placeholder="Short plan description"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">Billing interval</span>
                    <input
                      value={planFormState.billing_interval}
                      onChange={(event) => setPlanFormState((current) => ({ ...current, billing_interval: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                      placeholder="monthly"
                      required
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">Price</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={planFormState.price}
                      onChange={(event) => setPlanFormState((current) => ({ ...current, price: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                      placeholder="29.00"
                      required
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">Currency</span>
                    <input
                      value={planFormState.currency}
                      onChange={(event) => setPlanFormState((current) => ({ ...current, currency: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                      placeholder="USD"
                      required
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">Trial days</span>
                    <input
                      type="number"
                      min="0"
                      value={planFormState.trial_days}
                      onChange={(event) => setPlanFormState((current) => ({ ...current, trial_days: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                      placeholder="7"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Saving..." : editingPlanId ? "Update plan" : "Create plan"}
                  </button>

                  {editingPlanId ? (
                    <button
                      type="button"
                      onClick={resetPlanForm}
                      className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      Cancel edit
                    </button>
                  ) : null}
                </div>
              </form>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Plans</h2>
                  <p className="mt-1 text-sm text-slate-500">Active plans first. Use the actions to manage status.</p>
                </div>
                <p className="text-sm text-slate-500">{sortedPlans.length} total</p>
              </div>

              {plansLoading ? (
                <div className="rounded-2xl border border-slate-200 px-5 py-8 text-sm text-slate-500">Loading plans...</div>
              ) : sortedPlans.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-8 text-sm text-slate-500">No plans found.</div>
              ) : (
                <div className="space-y-4">
                  {sortedPlans.map((plan) => {
                    const loadingThisRow = actionLoadingId === plan.id;

                    return (
                      <article key={plan.id} className="rounded-2xl border border-slate-200 p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-slate-900">{plan.name}</h3>
                              <span className={`rounded-full px-3 py-1 text-xs font-medium ${plan.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                                {plan.is_active ? "Active" : "Inactive"}
                              </span>
                            </div>
                            <p className="text-sm leading-6 text-slate-500">{plan.description || "No description provided."}</p>
                            <div className="grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                              <span>Interval: {plan.billing_interval}</span>
                              <span>Price: {formatCurrency(plan.price, plan.currency)}</span>
                              <span>Trial: {plan.trial_days ?? 0} days</span>
                              <span>Updated: {formatDate(plan.updated_at)}</span>
                            </div>
                          </div>

                          <div className="flex w-full flex-col gap-2 lg:w-40 lg:shrink-0">
                            <button
                              type="button"
                              onClick={() => selectPlanForEdit(plan)}
                              className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleTogglePlanStatus(plan)}
                              disabled={loadingThisRow}
                              className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {loadingThisRow ? "Please wait..." : plan.is_active ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        ) : null}

        {activeTab === "subscriptions" ? (
          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-slate-900">Subscription filters</h2>
                <p className="mt-1 text-sm text-slate-500">View all, active, cancelled, or expiring subscriptions.</p>
              </div>

              <form onSubmit={handleSubscriptionFilterSubmit} className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Status</span>
                  <select
                    value={subscriptionFilter.status}
                    onChange={(event) =>
                      setSubscriptionFilter((current) => ({
                        ...current,
                        status: event.target.value as SubscriptionFilter["status"],
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="expiring">Expiring</option>
                  </select>
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">Expiring days</span>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={subscriptionFilter.expiringDays}
                      onChange={(event) =>
                        setSubscriptionFilter((current) => ({ ...current, expiringDays: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    />
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-700">Plan ID</span>
                    <input
                      value={subscriptionFilter.planId}
                      onChange={(event) =>
                        setSubscriptionFilter((current) => ({ ...current, planId: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                      placeholder="Optional"
                    />
                  </label>
                </div>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Customer ID</span>
                  <input
                    value={subscriptionFilter.customerId}
                    onChange={(event) =>
                      setSubscriptionFilter((current) => ({ ...current, customerId: event.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    placeholder="Optional"
                  />
                </label>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Load subscriptions
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Quick lookup</p>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <input
                      value={subscriptionLookupId}
                      onChange={(event) => setSubscriptionLookupId(event.target.value)}
                      className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                      placeholder="Subscription ID"
                    />
                    <button
                      type="button"
                      onClick={() => void handleSubscriptionLookup()}
                      disabled={searchingSubscription}
                      className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {searchingSubscription ? "Searching..." : "View subscription"}
                    </button>
                  </div>
                </div>
              </form>

              <div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm">
                <div className="rounded-2xl border border-slate-200 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Total</p>
                  <p className="mt-2 font-semibold text-slate-900">{subscriptionSummary.total}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Active</p>
                  <p className="mt-2 font-semibold text-slate-900">{subscriptionSummary.active}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Cancelled</p>
                  <p className="mt-2 font-semibold text-slate-900">{subscriptionSummary.cancelled}</p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Organization subscriptions</h2>
                  <p className="mt-1 text-sm text-slate-500">Use the tabs and filters to narrow the list.</p>
                </div>
                <p className="text-sm text-slate-500">{subscriptions.length} total</p>
              </div>

              {subscriptionsLoading ? (
                <div className="rounded-2xl border border-slate-200 px-5 py-8 text-sm text-slate-500">Loading subscriptions...</div>
              ) : subscriptions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-8 text-sm text-slate-500">No subscriptions found.</div>
              ) : (
                <div className="space-y-4">
                  {subscriptions.map((subscription) => {
                    const isSelected = selectedSubscription?.id === subscription.id;

                    return (
                      <article
                        key={subscription.id}
                        className={`cursor-pointer rounded-2xl border p-5 transition ${
                          isSelected ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-300"
                        }`}
                        onClick={() => setSelectedSubscription(subscription)}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-slate-900">{subscription.customer.name}</h3>
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                {subscription.status}
                              </span>
                            </div>
                            <p className="text-sm text-slate-500">{subscription.customer.email}</p>
                            <div className="grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                              <span>Plan: {subscription.plan.name}</span>
                              <span>Price: {formatCurrency(subscription.plan.price, subscription.plan.currency)}</span>
                              <span>Created: {formatDate(subscription.created_at)}</span>
                              <span>Updated: {formatDate(subscription.updated_at)}</span>
                            </div>
                          </div>

                          <div className="text-sm text-slate-500">
                            <p className="font-medium text-slate-900">{subscription.plan.billing_interval}</p>
                            <p className="mt-1">{subscription.cancel_at_period_end ? "Cancels at period end" : "Ongoing"}</p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
              <h2 className="text-lg font-semibold text-slate-900">Subscription details</h2>
              {selectedSubscription ? (
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "Customer", value: `${selectedSubscription.customer.name} • ${selectedSubscription.customer.email}` },
                    { label: "Plan", value: selectedSubscription.plan.name },
                    { label: "Status", value: selectedSubscription.status },
                    { label: "Current period start", value: formatDate(selectedSubscription.current_period_start) },
                    { label: "Current period end", value: formatDate(selectedSubscription.current_period_end) },
                    { label: "Cancelled at", value: formatDate(selectedSubscription.cancelled_at) },
                    { label: "Started at", value: formatDate(selectedSubscription.started_at) },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-200 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                      <p className="mt-2 break-words text-sm font-medium text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Select a subscription or use the lookup to inspect one record.</p>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default DashboardPage;