import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { UserType } from "../types";
import { api } from "../services/api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  userType: UserType;
}

interface AuthContextValue {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
    role: "ADMIN" | "TEACHER" | "STUDENT",
  ) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "academicore_token";
const USER_KEY = "academicore_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? (JSON.parse(stored) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = currentUser !== null;

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, [currentUser]);

  const login = async (
    email: string,
    password: string,
    _role: "ADMIN" | "TEACHER" | "STUDENT",
  ): Promise<boolean> => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("access_token", data.accessToken);
      localStorage.setItem("refresh_token", data.refreshToken);
      const payload = JSON.parse(atob(data.accessToken.split(".")[1]));
      const user: AuthUser = {
        id: payload.sub,
        name: `${data.user.firstName} ${data.user.lastName}`,
        email: data.user.email,
        role: (payload.roles?.[0] ?? data.user.userType) as
          | "ADMIN"
          | "TEACHER"
          | "STUDENT",
        userType: data.user.userType as UserType,
      };
      setCurrentUser(user);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  };

  return (
    <AuthContext.Provider
      value={{ currentUser, isAuthenticated, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
