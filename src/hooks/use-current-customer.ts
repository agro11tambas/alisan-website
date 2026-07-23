import { useCallback, useEffect, useState } from "react";
import api from "@/services/api";
import { CUSTOMER_AUTH_CHANGED_EVENT } from "@/lib/customer-auth-events";

import { Customer } from "@/types";

type MeResponse = {
  success: boolean;
  message: string;
  data: Customer;
};

export function useCurrentCustomer() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("customer_token");

    if (!token) {
      setCustomer(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get<MeResponse>("/ecommerce/auth/me");
      setCustomer(res.data.data);
    } catch {
      localStorage.removeItem("customer_token");
      setCustomer(null);
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
    isLoggedIn: !!customer,
    refreshCustomer: fetchCustomer,
  };
}
