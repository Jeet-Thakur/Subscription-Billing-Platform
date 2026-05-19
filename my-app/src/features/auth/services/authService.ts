import axios, { AxiosError } from "axios";

import { api } from "../../../lib/axios";

export type AuthPayload = {
  username: string;
  password: string;
};

export type ApiErrorResponse = {
  detail: string;
  info?: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
};

export const signupUser = async (
  data: AuthPayload
): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>(
      "/auth/signup",
      data
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiErrorResponse>;

      throw (
        axiosError.response?.data || {
          detail: "Unexpected error occurred",
        }
      );
    }

    throw {
      detail: "Unexpected error occurred",
    } satisfies ApiErrorResponse;
  }
};

export const loginUser = async (
  data: AuthPayload
): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>(
      "/auth/login",
      data
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiErrorResponse>;

      throw (
        axiosError.response?.data || {
          detail: "Unexpected error occurred",
        }
      );
    }

    throw {
      detail: "Unexpected error occurred",
    } satisfies ApiErrorResponse;
  }
};