const RAW_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Remove trailing slashes and normalize the API base URL
const API_URL = RAW_API_URL.replace(/\/+$/, "");

function normalizeEndpoint(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  // If API_URL already ends with /api, prevent /api/api duplication
  if (API_URL.endsWith("/api") && cleanEndpoint.startsWith("/api/")) {
    return cleanEndpoint.substring(4);
  }

  return cleanEndpoint;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("collabx_token")
      : null;

  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const normalizedEndpoint = normalizeEndpoint(endpoint);
  const requestUrl = `${API_URL}${normalizedEndpoint}`;

  const response = await fetch(requestUrl, {
    ...options,
    headers,
  });

  let data: any;

  try {
    data = await response.json();
  } catch {
    data = {
      success: false,
      message: "Invalid server response",
    };
  }

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}