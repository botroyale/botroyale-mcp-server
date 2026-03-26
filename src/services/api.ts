/**
 * Bot Royale API client — shared HTTP utilities.
 */

import axios, { AxiosError } from "axios";
import { API_BASE_URL, SITE_URL } from "../constants.js";

export async function apiGet<T>(path: string): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const response = await axios.get<T>(url, {
    timeout: 30000,
    headers: { Accept: "application/json" },
  });
  return response.data;
}

export async function apiPost<T>(path: string, data: unknown): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const response = await axios.post<T>(url, data, {
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
  return response.data;
}

export async function siteGet<T>(path: string): Promise<T> {
  const url = `${SITE_URL}${path}`;
  const response = await axios.get<T>(url, {
    timeout: 30000,
    headers: { Accept: "application/json" },
  });
  return response.data;
}

export function handleApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      const msg = typeof data === "object" && data !== null && "error" in data
        ? (data as { error: string }).error
        : typeof data === "string" ? data : `HTTP ${status}`;

      switch (status) {
        case 400:
          return `Error: Bad request — ${msg}. Check your config parameters are within valid ranges.`;
        case 404:
          return `Error: Not found — ${msg}. The season may not be active or the endpoint may have changed.`;
        case 409:
          return `Error: Conflict — ${msg}. This wallet may already be registered for this season.`;
        case 429:
          return "Error: Rate limited. Wait a moment before retrying.";
        case 500:
          return `Error: Server error — ${msg}. The Bot Royale backend may be experiencing issues.`;
        default:
          return `Error: API returned status ${status} — ${msg}`;
      }
    }
    if (error.code === "ECONNABORTED") {
      return "Error: Request timed out. The Bot Royale API may be slow or unreachable.";
    }
    if (error.code === "ECONNREFUSED") {
      return "Error: Could not connect to Bot Royale API. The server may be down.";
    }
  }
  return `Error: ${error instanceof Error ? error.message : String(error)}`;
}
