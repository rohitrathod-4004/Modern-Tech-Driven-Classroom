import { jwtDecode } from "jwt-decode";

export interface DecodedToken {
  userId: string;
  role: "faculty" | "student";
  exp: number;
  iat: number;
}

const TOKEN_KEY = "mtc_auth_token";

export const authService = {
  setToken(token: string) {
    sessionStorage.setItem(TOKEN_KEY, token);
  },

  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  },

  removeToken() {
    sessionStorage.removeItem(TOKEN_KEY);
  },

  getDecodedToken(): DecodedToken | null {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      return jwtDecode<DecodedToken>(token);
    } catch (e) {
      return null;
    }
  },

  isAuthenticated(): boolean {
    const decoded = this.getDecodedToken();
    if (!decoded) return false;
    
    // Check if token is expired (exp is in seconds)
    if (decoded.exp * 1000 < Date.now()) {
      this.removeToken();
      return false;
    }
    
    return true;
  },

  getUserRole(): "faculty" | "student" | null {
    const decoded = this.getDecodedToken();
    return decoded ? decoded.role : null;
  }
};
