export async function api<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { headers: { "Content-Type": "application/json", ...(options.headers || {}) }, ...options });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(body || `Erreur API ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export const getJson = <T = any>(url: string) => api<T>(url);
