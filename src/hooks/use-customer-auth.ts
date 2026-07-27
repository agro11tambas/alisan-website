import { useState } from "react";

import { LoginPayload, LoginResponse } from "@/types/auth-type";
import api from "@/services/api";
import { notifyCustomerAuthChanged } from "@/lib/customer-auth-events";
import { saveCustomerSession } from "@/lib/customer-session";

export function useCustomerLogin() {
  const [loading, setLoading] = useState(false);

  async function login(payload: LoginPayload) {
    setLoading(true);

    try {
      const res = await api.post<LoginResponse>(
        "/ecommerce/auth/login",
        payload,
      );

      const { token, customer, user } = res.data.data;
      saveCustomerSession(token, customer ?? user);
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
