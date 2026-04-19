import type { Role } from "@/lib/rbac";

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: Role;
  role_id: string;
  division_id: string;
  is_restrict: boolean;
  is_active: boolean;
}

export interface StoredUser extends User {
  password?: string;
}

export interface LoginResponse {
  status: boolean;
  message: string;
  data: {
    data: {
      id: string;
      username: string;
      email: string;
      role_id: string;
      division_id: string;
      created_at: string;
      updated_at: string;
      role?: {
        id?: string;
        name?: string;
        role_name?: string;
      };
      division?: {
        id?: string;
        name?: string;
        division_name?: string;
      };
    };
    token: string;
    refreshToken: string;
  };
}

export interface RefreshResponse {
  status: boolean;
  message: string;
  data: {
    token: string;
    refreshToken?: string;
  };
}

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  name: string;
  role_id: string;
  division_id: string;
  is_restrict: boolean;
  is_active: boolean;
  phone?: string;
  phone_number?: string;
  role_name?: string;
  division_name?: string;
}

export interface UserPayload {
  name: string;
  username: string;
  email: string;
  password?: string;
  phone?: string;
  is_active?: boolean;
  is_restrict?: boolean;
  role_id: string;
  division_id: string;
}
