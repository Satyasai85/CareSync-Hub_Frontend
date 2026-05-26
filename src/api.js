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

export async function downloadReport(path, { role = "admin", filename = "report.csv" } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "x-user-role": role
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Report download failed" }));
    throw new Error(error.message || "Report download failed");
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
