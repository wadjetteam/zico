import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { api } from "../api/client";

interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  canWrite: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("compliance_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await api.post("/auth/login", { username, password });
    localStorage.setItem("compliance_token", data.token);
    localStorage.setItem("compliance_user", JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("compliance_token");
    localStorage.removeItem("compliance_user");
    setUser(null);
  }, []);

  const canWrite = user?.role === "Admin" || user?.role === "ComplianceManager";

  return (
    <AuthContext.Provider value={{ user, login, logout, canWrite }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
