import axios, { AxiosError } from "axios";

import { api } from "../../../lib/axios";

export type ApiErrorResponse = {
  detail: string;
  info?: string;
};

export type SubscriptionCustomer = {
  id: string;
  email: string;
  name: string;
};

export type SubscriptionPlan = {
  id: string;
  name: string;
  billing_interval: string;
  price: string;
  currency: string;
  is_active: boolean;
};

export type OrganizationSubscription = {
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
  customer: SubscriptionCustomer;
  plan: SubscriptionPlan;
};

export type OrganizationSubscriptionsQuery = {
  status?: string;
  plan_id?: string;
  customer_id?: string;
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

function buildQueryString(query: OrganizationSubscriptionsQuery) {
  const params = new URLSearchParams();

  if (query.status) {
    params.set("status", query.status);
  }

  if (query.plan_id) {
    params.set("plan_id", query.plan_id);
  }

  if (query.customer_id) {
    params.set("customer_id", query.customer_id);
  }

  const queryString = params.toString();

  return queryString ? `?${queryString}` : "";
}

export async function getOrganizationSubscriptions(
  query: OrganizationSubscriptionsQuery = {}
): Promise<OrganizationSubscription[]> {
  try {
    const response = await api.get<OrganizationSubscription[]>(
      `/organization/subscriptions${buildQueryString(query)}`
    );

    return response.data;
  } catch (error) {
    throw getApiError(error);
  }
}

export async function getActiveSubscriptions(): Promise<OrganizationSubscription[]> {
  try {
    const response = await api.get<OrganizationSubscription[]>(
      "/organization/subscriptions/active"
    );

    return response.data;
  } catch (error) {
    throw getApiError(error);
  }
}

export async function getCancelledSubscriptions(): Promise<OrganizationSubscription[]> {
  try {
    const response = await api.get<OrganizationSubscription[]>(
      "/organization/subscriptions/cancelled"
    );

    return response.data;
  } catch (error) {
    throw getApiError(error);
  }
}

export async function getExpiringSubscriptions(days: number): Promise<OrganizationSubscription[]> {
  try {
    const response = await api.get<OrganizationSubscription[]>(
      `/organization/subscriptions/expiring?days=${days}`
    );

    return response.data;
  } catch (error) {
    throw getApiError(error);
  }
}

export async function getSubscriptionById(subscriptionId: string): Promise<OrganizationSubscription> {
  try {
    const response = await api.get<OrganizationSubscription>(
      `/organization/subscriptions/${subscriptionId}`
    );

    return response.data;
  } catch (error) {
    throw getApiError(error);
  }
}