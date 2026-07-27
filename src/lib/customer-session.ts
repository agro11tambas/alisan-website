import { Customer } from "@/types";

export const CUSTOMER_TOKEN_KEY = "customer_token";
export const CUSTOMER_PROFILE_KEY = "customer_profile";

export function getCustomerToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CUSTOMER_TOKEN_KEY);
}

export function getCachedCustomer(): Customer | null {
  if (typeof window === "undefined") return null;

  const cached = localStorage.getItem(CUSTOMER_PROFILE_KEY);
  if (!cached) return null;

  try {
    return JSON.parse(cached) as Customer;
  } catch {
    localStorage.removeItem(CUSTOMER_PROFILE_KEY);
    return null;
  }
}

export function cacheCustomer(customer: unknown): void {
  if (typeof window === "undefined" || !customer) return;
  localStorage.setItem(CUSTOMER_PROFILE_KEY, JSON.stringify(customer));
}

export function saveCustomerSession(token: string, customer?: unknown): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
  if (customer) cacheCustomer(customer);
}

export function clearCustomerSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  localStorage.removeItem(CUSTOMER_PROFILE_KEY);
}
