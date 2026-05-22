import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { authService } from "../services/authService";
import type { DecodedToken } from "../services/authService";

interface AuthContextType {
  isAuthenticated: boolean;
  user: DecodedToken | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<DecodedToken | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check initial auth state
    if (authService.isAuthenticated()) {
      setIsAuthenticated(true);
      setUser(authService.getDecodedToken());
    } else {
      authService.removeToken();
    }
    setIsLoading(false);
  }, []);

  const login = (token: string) => {
    authService.setToken(token);
    setIsAuthenticated(true);
    setUser(authService.getDecodedToken());
  };

  const logout = () => {
    authService.removeToken();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
