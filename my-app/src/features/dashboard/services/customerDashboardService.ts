import axios, { AxiosError } from "axios";

import { api } from "../../../lib/axios";

export type ApiErrorResponse = {
  detail: string;
  info?: string;
};

export type CustomerPlan = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  billing_interval: string;
  price: string;
  currency: string;
  trial_days: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomerSubscriptionPurchaseRequest = {
  plan_id: string;
};

export type CustomerSubscription = {
  id: string;
  organization_id: string;
  customer_id: string;
  plan_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  cancelled_at: string | null;
  started_at: string | null;
  created_at: string;
  updated_at: string;
  customer: {
    id: string;
    email: string;
    name: string;
  };
  plan: {
    id: string;
    name: string;
    billing_interval: string;
    price: string;
    currency: string;
    is_active: boolean;
  };
};

export type CustomerSubscriptionPurchaseResponse = {
  subscription: CustomerSubscription;
  invoice: CustomerInvoice;
};

export type CustomerInvoice = {
  id: string;
  invoice_number: string;
  organization_id: string;
  organization_name: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  subscription_id: string;
  plan_id: string;
  plan_name: string;
  billing_interval: string;
  amount: string;
  currency: string;
  subtotal: string;
  total: string;
  invoice_status: string;
  created_at: string;
  paid_at: string | null;
};

function getApiError(error: unknown): ApiErrorResponse {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorResponse>;

    return (
      axiosError.response?.data || {
        detail: "Unexpected error occurred",
      }
    );
  }

  return {
    detail: "Unexpected error occurred",
  };
}

export async function getAvailablePlans(): Promise<CustomerPlan[]> {
  try {
    const response = await api.get<CustomerPlan[]>("/plans");

    return response.data;
  } catch (error) {
    throw getApiError(error);
  }
}

export async function getAvailablePlan(planId: string): Promise<CustomerPlan> {
  try {
    const response = await api.get<CustomerPlan>(`/plans/${planId}`);

    return response.data;
  } catch (error) {
    throw getApiError(error);
  }
}

export async function purchasePlan(
  request: CustomerSubscriptionPurchaseRequest
): Promise<CustomerSubscriptionPurchaseResponse> {
  try {
    const response = await api.post<CustomerSubscriptionPurchaseResponse>(
      "/subscriptions/purchase",
      request
    );

    return response.data;
  } catch (error) {
    throw getApiError(error);
  }
}

export async function getCustomerInvoices(): Promise<CustomerInvoice[]> {
  try {
    const response = await api.get<CustomerInvoice[]>("/invoices");

    return response.data;
  } catch (error) {
    throw getApiError(error);
  }
}

export async function getCustomerInvoice(invoiceId: string): Promise<CustomerInvoice> {
  try {
    const response = await api.get<CustomerInvoice>(`/invoices/${invoiceId}`);

    return response.data;
  } catch (error) {
    throw getApiError(error);
  }
}