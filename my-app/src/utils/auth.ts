export const getAccessToken = () => {
  return localStorage.getItem("access_token");
};

export type JwtClaims = {
  sub?: string;
  actor_type?: string;
  user_id?: string;
  customer_id?: string;
  organization_id?: string;
  email?: string;
  role?: string;
  exp?: number;
};

function decodeBase64Url(value: string) {
  const normalizedValue = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddedValue = normalizedValue.padEnd(
    Math.ceil(normalizedValue.length / 4) * 4,
    "="
  );

  return atob(paddedValue);
}

export const getAccessTokenClaims = (): JwtClaims | null => {
  const token = getAccessToken();

  if (!token) {
    return null;
  }

  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return null;
    }

    return JSON.parse(decodeBase64Url(payload)) as JwtClaims;
  } catch {
    return null;
  }
};

export const setAccessToken = (
  token: string
) => {
  localStorage.setItem(
    "access_token",
    token
  );
};

export const removeAccessToken = () => {
  localStorage.removeItem("access_token");
};

export const isAuthenticated = () => {
  return !!getAccessToken();
};