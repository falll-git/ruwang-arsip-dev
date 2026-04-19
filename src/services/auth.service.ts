import axios from "axios";
import api, { getAccessToken } from "@/lib/axios";
import type { LoginResponse, RefreshResponse } from "@/types/auth.types";

export const authService = {
  login: async (
    username: string,
    password: string,
  ): Promise<LoginResponse> => {
    const res = await api.post("/auth/login", { username, password });
    return res.data;
  },
  refresh: async (refreshToken: string): Promise<RefreshResponse> => {
    const res = await api.post("/auth/refresh", { refreshToken });
    return res.data;
  },
  logout: async () => {
    const token = getAccessToken();

    await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/logout`,
      undefined,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        validateStatus: (status) =>
          (status >= 200 && status < 300) || status === 401 || status === 403,
      },
    );
  },
};
