import { useCallback, useEffect, useState } from "react";
import api from "@/services/api";
import { CUSTOMER_AUTH_CHANGED_EVENT } from "@/lib/customer-auth-events";
import {
  cacheCustomer,
  getCachedCustomer,
  getCustomerToken,
} from "@/lib/customer-session";
import { Customer } from "@/types";

type MeResponse = {
  success: boolean;
  message: string;
  data: Customer;
};

let currentCustomerRequest: Promise<Customer> | null = null;
let currentCustomerToken: string | null = null;

function requestCurrentCustomer(token: string): Promise<Customer> {
  if (currentCustomerRequest && currentCustomerToken === token) {
    return currentCustomerRequest;
  }

  currentCustomerToken = token;
  const request = api
    .get<MeResponse>("/ecommerce/auth/me")
    .then((response) => response.data.data);

  currentCustomerRequest = request;
  const clearRequest = () => {
    if (currentCustomerRequest === request) currentCustomerRequest = null;
  };
  void request.then(clearRequest, clearRequest);

  return request;
}

export function useCurrentCustomer() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    const token = getCustomerToken();
    setHasToken(!!token);

    if (!token) {
      setCustomer(null);
      setLoading(false);
      return;
    }

    const cachedCustomer = getCachedCustomer();
    if (cachedCustomer) setCustomer(cachedCustomer);

    try {
      const freshCustomer = await requestCurrentCustomer(token);
      setCustomer(freshCustomer);
      cacheCustomer(freshCustomer);
    } catch (error) {
      // A temporary network/API failure must not destroy a valid login session.
      // Keep both the bearer token and the last known customer profile.
      console.error("Gagal memperbarui sesi customer:", error);
      setCustomer((currentCustomer) => currentCustomer ?? cachedCustomer);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialFetch = window.setTimeout(() => {
      void fetchCustomer();
    }, 0);

    const handleAuthChange = () => {
      void fetchCustomer();
    };
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "customer_token") {
        void fetchCustomer();
      }
    };

    window.addEventListener(CUSTOMER_AUTH_CHANGED_EVENT, handleAuthChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.clearTimeout(initialFetch);
      window.removeEventListener(CUSTOMER_AUTH_CHANGED_EVENT, handleAuthChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [fetchCustomer]);

  return {
    customer,
    loading,
    isLoggedIn: hasToken,
    refreshCustomer: fetchCustomer,
  };
}
