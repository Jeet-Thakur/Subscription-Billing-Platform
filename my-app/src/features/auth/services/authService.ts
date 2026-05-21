import axios, { AxiosError } from "axios";

import { api } from "../../../lib/axios";

export type ApiErrorResponse = {
  detail: string;
  info?: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type OrganizationSignupRequest = {
  organization: {
    name: string;
    slug: string;
    billing_email: string;
    stripe_account_id?: string | null;
  };
  user: {
    email: string;
    password: string;
  };
};

export type OrganizationResponse = {
  id: string;
  name: string;
  slug: string;
  billing_email: string;
  stripe_account_id: string | null;
  created_at: string;
  updated_at: string;
};

export type UserResponse = {
  id: string;
  organization_id: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

export type CustomerResponse = {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type OrganizationSignupResponse = AuthResponse & {
  organization: OrganizationResponse;
  user: UserResponse;
};

export type UserRegistrationRequest = {
  email: string;
  password: string;
  role: string;
};

export type UserRegistrationResponse = {
  user: UserResponse;
  access_token?: string;
  token_type?: string;
};

export type CustomerRegistrationRequest = {
  email: string;
  password: string;
  name: string;
};

export type CustomerRegistrationResponse = AuthResponse & {
  customer: CustomerResponse;
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

export const signupOrganization = async (
  data: OrganizationSignupRequest
): Promise<OrganizationSignupResponse> => {
  try {
    const response = await api.post<OrganizationSignupResponse>(
      "/auth/signup",
      data
    );

    return response.data;
  } catch (error) {
    throw getApiError(error);
  }
};

export const loginAdmin = async (
  data: LoginRequest
): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>(
      "/auth/login",
      data
    );

    return response.data;
  } catch (error) {
    throw getApiError(error);
  }
};

export const registerAdmin = async (
  data: UserRegistrationRequest
): Promise<UserRegistrationResponse> => {
  try {
    const response = await api.post<UserRegistrationResponse>(
      "/auth/users/register",
      data
    );

    return response.data;
  } catch (error) {
    throw getApiError(error);
  }
};

export const loginCustomer = async (
  data: LoginRequest
): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>(
      "/auth/customers/login",
      data
    );

    return response.data;
  } catch (error) {
    throw getApiError(error);
  }
};

export const registerCustomer = async (
  data: CustomerRegistrationRequest
): Promise<CustomerRegistrationResponse> => {
  try {
    const response = await api.post<CustomerRegistrationResponse>(
      "/auth/customers/register",
      data
    );

    return response.data;
  } catch (error) {
    throw getApiError(error);
  }
};