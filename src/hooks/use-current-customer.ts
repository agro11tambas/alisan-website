import { useEffect, useState } from "react";
import api from "@/services/api";

import { Customer } from "@/types";

type MeResponse = {
  success: boolean;
  message: string;
  data: Customer;
};

export function useCurrentCustomer() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCustomer = async () => {
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
  };

  useEffect(() => {
    fetchCustomer();
  }, []);

  return {
    customer,
    loading,
    isLoggedIn: !!customer,
    refreshCustomer: fetchCustomer,
  };
}
