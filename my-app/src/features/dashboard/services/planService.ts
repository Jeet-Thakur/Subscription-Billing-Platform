import axios, { AxiosError } from "axios";

import { api } from "../../../lib/axios";

export type ApiErrorResponse = {
  detail: string;
  info?: string;
};

export type Plan = {
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

export type PlanCreateRequest = {
  name: string;
  description?: string | null;
  billing_interval: string;
  price: string;
  currency: string;
  trial_days?: number | null;
};

export type PlanUpdateRequest = Partial<PlanCreateRequest> & {
  is_active?: boolean;
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

export async function getOrganizationPlans(): Promise<Plan[]> {
  try {
    const response = await api.get<Plan[]>("/organization/plans");

    return response.data;
  } catch (error) {
    throw getApiError(error);
  }
}

export async function createPlan(data: PlanCreateRequest): Promise<Plan> {
  try {
    const response = await api.post<Plan>("/organization/plans", data);

    return response.data;
  } catch (error) {
    throw getApiError(error);
  }
}

export async function updatePlan(
  planId: string,
  data: PlanUpdateRequest
): Promise<Plan> {
  try {
    const response = await api.patch<Plan>(`/organization/plans/${planId}`, data);

    return response.data;
  } catch (error) {
    throw getApiError(error);
  }
}

export async function activatePlan(planId: string): Promise<Plan> {
  try {
    const response = await api.patch<Plan>(`/organization/plans/${planId}/activate`);

    return response.data;
  } catch (error) {
    throw getApiError(error);
  }
}

export async function deactivatePlan(planId: string): Promise<Plan> {
  try {
    const response = await api.patch<Plan>(`/organization/plans/${planId}/deactivate`);

    return response.data;
  } catch (error) {
    throw getApiError(error);
  }
}

export async function deletePlan(planId: string): Promise<void> {
  try {
    await api.post(`/organization/plans/${planId}/delete`);
  } catch (error) {
    throw getApiError(error);
  }
}