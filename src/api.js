const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function api(path, { role = "admin", ...options } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-user-role": role,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  if (response.status === 204) return null;
  return response.json();
}

export function reportUrl(path) {
  return `${API_URL}${path}`;
}
