import axios, { AxiosError } from "axios";

import { api } from "../../../lib/axios";

export type ApiErrorResponse = {
  detail: string;
  info?: string;
};

export type RevenueByPlan = {
  plan_id: string;
  plan_name: string;
  currency: string;
  revenue: string;
};

export type SubscriptionCountByPlan = {
  plan_id: string;
  plan_name: string;
  subscription_count: number;
};

export type RecentSubscription = {
  subscription_id: string;
  status: string;
  created_at: string;
  customer_id: string;
  customer_email: string;
  customer_name: string;
  plan_id: string;
  plan_name: string;
};

export type DashboardSummary = {
  total_subscriptions_count: number;
  active_subscriptions_count: number;
  cancelled_subscriptions_count: number;
  monthly_recurring_revenue: string;
  revenue_by_plan: RevenueByPlan[];
  subscription_count_by_plan: SubscriptionCountByPlan[];
  recent_subscriptions: RecentSubscription[];
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

export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    const response = await api.get<DashboardSummary>("/organization/dashboard/summary");

    return response.data;
  } catch (error) {
    throw getApiError(error);
  }
}