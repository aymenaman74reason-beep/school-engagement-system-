import { create } from "zustand";

export interface User {
  id: string;
  _id?: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  role: "admin" | "teacher" | "student" | "parent";
  phone?: string;
  isActive?: boolean;
  status?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: any, token: string) => void;
  logout: () => void;
  hydrateAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("token"),
  isAuthenticated: !!localStorage.getItem("token"),
  setAuth: (rawUser: any, token: string) => {
    // Normalize backend _id to id
    const user: User = {
      ...rawUser,
      id: rawUser.id || rawUser._id,
    };
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, token: null, isAuthenticated: false });
  },
  hydrateAuth: () => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true });
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  },
}));
