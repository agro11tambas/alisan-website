import { useState } from "react";

import { LoginPayload, LoginResponse } from "@/types/auth-type";
import api from "@/services/api";
import { notifyCustomerAuthChanged } from "@/lib/customer-auth-events";

export function useCustomerLogin() {
  const [loading, setLoading] = useState(false);

  async function login(payload: LoginPayload) {
    setLoading(true);

    try {
      const res = await api.post<LoginResponse>(
        "/ecommerce/auth/login",
        payload,
      );

      const token = res.data.data.token;

      localStorage.setItem("customer_token", token);
      notifyCustomerAuthChanged();

      return res.data;
    } finally {
      setLoading(false);
    }
  }

  return {
    login,
    loading,
  };
}
