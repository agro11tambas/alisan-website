import { useEffect, useState } from "react";
import api from "@/services/api";

type CustomerAccount = {
  id: number | string;
  name: string;
  email: string;
  whatsapp_number?: string | null;
};

type MeResponse = {
  success: boolean;
  message: string;
  data: CustomerAccount;
};

export function useCurrentCustomer() {
  const [customer, setCustomer] = useState<CustomerAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCustomer() {
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
    }

    fetchCustomer();
  }, []);

  return {
    customer,
    loading,
    isLoggedIn: !!customer,
  };
}
