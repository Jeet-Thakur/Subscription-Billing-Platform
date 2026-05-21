import { useEffect, useMemo, useState } from "react";

import {
  getAvailablePlans,
  getAvailablePlan,
  getCustomerInvoices,
  purchasePlan,
  type ApiErrorResponse,
  type CustomerInvoice,
  type CustomerPlan,
  type CustomerSubscriptionPurchaseResponse,
} from "../services/customerDashboardService";

type AuthContext = {
  email?: string;
  role?: string;
  actorType?: string;
};

type CustomerTab = "plans" | "purchase" | "invoices";

type Props = {
  authContext: AuthContext;
  onLogout: () => void;
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

function CustomerDashboard({ authContext, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<CustomerTab>("plans");
  const [plans, setPlans] = useState<CustomerPlan[]>([]);
  const [invoices, setInvoices] = useState<CustomerInvoice[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<CustomerPlan | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<CustomerInvoice | null>(null);
  const [purchasePlanId, setPurchasePlanId] = useState("");
  const [invoiceLookupId, setInvoiceLookupId] = useState("");
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [lookingUpPlan, setLookingUpPlan] = useState(false);
  const [lookingUpInvoice, setLookingUpInvoice] = useState(false);
  const [error, setError] = useState<ApiErrorResponse | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  const loadPlans = async () => {
    try {
      setLoadingPlans(true);
      const data = await getAvailablePlans();
      setPlans(data);

      if (!purchasePlanId && data.length > 0) {
        setPurchasePlanId(data[0].id);
      }
    } catch (planError) {
      setError(planError as ApiErrorResponse);
    } finally {
      setLoadingPlans(false);
    }
  };

  const loadInvoices = async () => {
    try {
      setLoadingInvoices(true);
      const data = await getCustomerInvoices();
      setInvoices(data);

      if (!selectedInvoice && data.length > 0) {
        setSelectedInvoice(data[0]);
      }
    } catch (invoiceError) {
      setError(invoiceError as ApiErrorResponse);
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    void loadPlans();
    void loadInvoices();
  }, []);

  useEffect(() => {
    if (!purchasePlanId || plans.length === 0) {
      return;
    }

    const currentPlan = plans.find((plan) => plan.id === purchasePlanId);

    if (!currentPlan) {
      setPurchasePlanId(plans[0].id);
    }
  }, [plans, purchasePlanId]);

  const currentPurchasePlan = useMemo(() => {
    return plans.find((plan) => plan.id === purchasePlanId) ?? null;
  }, [plans, purchasePlanId]);

  const subscriptionMetrics = useMemo(() => {
    return {
      totalInvoices: invoices.length,
      paidInvoices: invoices.filter((invoice) => invoice.invoice_status === "paid").length,
    };
  }, [invoices]);

  const openPlanDetails = async (planId: string) => {
    setLookingUpPlan(true);
    setError(null);

    try {
      const plan = await getAvailablePlan(planId);
      setSelectedPlan(plan);
      setPurchasePlanId(plan.id);
      setActiveTab("purchase");
    } catch (planError) {
      setError(planError as ApiErrorResponse);
    } finally {
      setLookingUpPlan(false);
    }
  };

  const handlePurchase = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!purchasePlanId) {
      return;
    }

    setPurchasing(true);
    setError(null);
    setSuccessMessage("");

    try {
      const response: CustomerSubscriptionPurchaseResponse = await purchasePlan({
        plan_id: purchasePlanId,
      });

      setSuccessMessage("Plan purchased successfully.");
      setSelectedInvoice(response.invoice);
      setActiveTab("invoices");
      await loadInvoices();
    } catch (purchaseError) {
      setError(purchaseError as ApiErrorResponse);
    } finally {
      setPurchasing(false);
    }
  };

  const handleInvoiceLookup = async (invoiceId: string) => {
    if (!invoiceId.trim()) {
      return;
    }

    setLookingUpInvoice(true);
    setError(null);

    try {
      const invoice = invoices.find((item) => item.id === invoiceId.trim()) ?? null;

      if (invoice) {
        setSelectedInvoice(invoice);
        setInvoiceLookupId(invoice.id);
      }
    } finally {
      setLookingUpInvoice(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Customer Dashboard</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {activeTab === "plans" ? "Available Plans" : activeTab === "purchase" ? "Purchase Plan" : "Invoices"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {authContext.email ? `${authContext.email}${authContext.role ? ` • ${authContext.role}` : ""}` : "Authenticated session"}
            </p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Logout
          </button>
        </header>

        <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
          {([
            ["plans", "Plans"],
            ["purchase", "Purchase"],
            ["invoices", "Invoices"],
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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Available plans</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{plans.length}</p>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Invoices</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{subscriptionMetrics.totalInvoices}</p>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2 xl:col-span-1">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Paid invoices</p>
            <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{subscriptionMetrics.paidInvoices}</p>
          </article>
        </section>

        {activeTab === "plans" ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Available Plans</h2>
                <p className="mt-1 text-sm text-slate-500">Browse all active plans and open one to purchase.</p>
              </div>
              <button
                type="button"
                onClick={() => void loadPlans()}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                Refresh
              </button>
            </div>

            {loadingPlans ? (
              <div className="rounded-2xl border border-slate-200 px-5 py-8 text-sm text-slate-500">Loading plans...</div>
            ) : plans.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-8 text-sm text-slate-500">No plans available.</div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {plans.map((plan) => (
                  <article key={plan.id} className="rounded-2xl border border-slate-200 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-900">{plan.name}</h3>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            {plan.billing_interval}
                          </span>
                        </div>
                        <p className="text-sm leading-6 text-slate-500">
                          {plan.description || "No description provided."}
                        </p>
                      </div>

                      <p className="text-sm font-semibold text-slate-900">
                        {formatCurrency(plan.price, plan.currency)}
                      </p>
                    </div>

                    <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                      <span>Trial: {plan.trial_days ?? 0} days</span>
                      <span>Currency: {plan.currency}</span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setPurchasePlanId(plan.id);
                          setSelectedPlan(plan);
                          setActiveTab("purchase");
                        }}
                        className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                      >
                        Purchase plan
                      </button>

                      <button
                        type="button"
                        onClick={() => void openPlanDetails(plan.id)}
                        disabled={lookingUpPlan}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {lookingUpPlan ? "Loading..." : "View details"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {activeTab === "purchase" ? (
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-slate-900">Purchase a plan</h2>
                <p className="mt-1 text-sm text-slate-500">Select an available plan and purchase it with a single token-authenticated request.</p>
              </div>

              <form onSubmit={handlePurchase} className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Plan</span>
                  <select
                    value={purchasePlanId}
                    onChange={(event) => {
                      setPurchasePlanId(event.target.value);
                      setSelectedPlan(plans.find((plan) => plan.id === event.target.value) ?? null);
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  >
                    {plans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - {formatCurrency(plan.price, plan.currency)}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  {currentPurchasePlan ? (
                    <>
                      <p className="font-medium text-slate-900">{currentPurchasePlan.name}</p>
                      <p className="mt-1 leading-6">{currentPurchasePlan.description || "No description provided."}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500">
                        {currentPurchasePlan.billing_interval} • {formatCurrency(currentPurchasePlan.price, currentPurchasePlan.currency)}
                      </p>
                    </>
                  ) : (
                    <p>No plan selected.</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={purchasing || plans.length === 0}
                  className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {purchasing ? "Purchasing..." : "Purchase subscription"}
                </button>
              </form>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-slate-900">Selected plan</h2>
                <p className="mt-1 text-sm text-slate-500">Plan details are shown here before purchase.</p>
              </div>

              {selectedPlan ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 px-5 py-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Plan ID</p>
                    <p className="mt-2 break-words text-sm font-medium text-slate-900">{selectedPlan.id}</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 px-5 py-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Billing interval</p>
                      <p className="mt-2 text-sm font-medium text-slate-900">{selectedPlan.billing_interval}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 px-5 py-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Price</p>
                      <p className="mt-2 text-sm font-medium text-slate-900">{formatCurrency(selectedPlan.price, selectedPlan.currency)}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 px-5 py-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Trial days</p>
                      <p className="mt-2 text-sm font-medium text-slate-900">{selectedPlan.trial_days ?? 0}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 px-5 py-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Status</p>
                      <p className="mt-2 text-sm font-medium text-slate-900">{selectedPlan.is_active ? "Available" : "Inactive"}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-8 text-sm text-slate-500">
                  Select a plan from the Plans tab to inspect it here.
                </div>
              )}
            </section>
          </div>
        ) : null}

        {activeTab === "invoices" ? (
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Invoices</h2>
                  <p className="mt-1 text-sm text-slate-500">Browse your invoices and open one for full details.</p>
                </div>
                <button
                  type="button"
                  onClick={() => void loadInvoices()}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Refresh
                </button>
              </div>

              {loadingInvoices ? (
                <div className="rounded-2xl border border-slate-200 px-5 py-8 text-sm text-slate-500">Loading invoices...</div>
              ) : invoices.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-8 text-sm text-slate-500">No invoices found.</div>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <article
                      key={invoice.id}
                      className={`cursor-pointer rounded-2xl border p-5 transition ${
                        selectedInvoice?.id === invoice.id ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-300"
                      }`}
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setInvoiceLookupId(invoice.id);
                      }}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-slate-900">{invoice.invoice_number}</h3>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                              {invoice.invoice_status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500">{invoice.plan_name}</p>
                          <p className="text-xs text-slate-500">{invoice.organization_name}</p>
                        </div>

                        <div className="text-sm text-slate-500">
                          <p className="font-medium text-slate-900">{formatCurrency(invoice.total, invoice.currency)}</p>
                          <p className="mt-1">{formatDate(invoice.created_at)}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-slate-900">Invoice details</h2>
                <p className="mt-1 text-sm text-slate-500">Click an invoice to review the billing record.</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    value={invoiceLookupId}
                    onChange={(event) => {
                      setInvoiceLookupId(event.target.value);
                      const invoice = invoices.find((item) => item.id === event.target.value) ?? null;
                      setSelectedInvoice(invoice);
                    }}
                    className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    placeholder="Paste an invoice ID"
                  />
                  <button
                    type="button"
                    onClick={() => void handleInvoiceLookup(invoiceLookupId)}
                    disabled={lookingUpInvoice}
                    className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {lookingUpInvoice ? "Searching..." : "Open"}
                  </button>
                </div>
              </div>

              {selectedInvoice ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {[
                    { label: "Invoice number", value: selectedInvoice.invoice_number },
                    { label: "Status", value: selectedInvoice.invoice_status },
                    { label: "Organization", value: selectedInvoice.organization_name },
                    { label: "Customer", value: selectedInvoice.customer_name },
                    { label: "Email", value: selectedInvoice.customer_email },
                    { label: "Plan", value: selectedInvoice.plan_name },
                    { label: "Amount", value: formatCurrency(selectedInvoice.total, selectedInvoice.currency) },
                    { label: "Paid at", value: formatDate(selectedInvoice.paid_at) },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-200 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
                      <p className="mt-2 break-words text-sm font-medium text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-200 px-5 py-8 text-sm text-slate-500">
                  Select an invoice to see the full receipt information.
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default CustomerDashboard;