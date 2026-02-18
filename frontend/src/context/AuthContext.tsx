import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { AuthClient } from "@dfinity/auth-client";
import type { Identity } from "@dfinity/agent";

const II_PROVIDER_MAINNET = "https://identity.ic0.app";
const II_PROVIDER_LOCAL = "http://localhost:4943?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai";

interface AuthContextType {
  identity: Identity | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);

  const isMainnet =
    import.meta.env.VITE_USE_MAINNET === "true" ||
    import.meta.env.VITE_USE_MAINNET === "1" ||
    (typeof window !== "undefined" &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1");
  const identityProvider = isMainnet ? II_PROVIDER_MAINNET : II_PROVIDER_LOCAL;

  const initAuth = useCallback(async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const client = await AuthClient.create({
        idleOptions: {
          disableIdle: false,
          disableDefaultIdleCallback: true,
        },
      });
      setAuthClient(client);
      const authenticated = await client.isAuthenticated();
      if (authenticated) {
        setIdentity(client.getIdentity());
      } else {
        setIdentity(null);
      }
    } catch (err) {
      console.error("Auth init failed:", err);
      setAuthError(err instanceof Error ? err.message : "Failed to initialize auth");
      setIdentity(null);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = useCallback(async () => {
    setAuthError(null);
    const client = authClient ?? (await AuthClient.create({
      idleOptions: {
        disableIdle: false,
        disableDefaultIdleCallback: true,
      },
    }));
    if (!authClient) setAuthClient(client);

    return new Promise<void>((resolve, reject) => {
      client.login({
        identityProvider,
        maxTimeToLive: BigInt(7) * BigInt(24) * BigInt(3_600_000_000_000),
        onSuccess: () => {
          setIdentity(client.getIdentity());
          resolve();
        },
        onError: (err) => {
          const msg = err === "UserInterrupt" ? "Login cancelled" : err ?? "Login failed";
          setAuthError(typeof msg === "string" ? msg : "Login failed");
          reject(new Error(msg));
        },
      });
    });
  }, [authClient, identityProvider]);

  const logout = useCallback(async () => {
    if (authClient) {
      await authClient.logout();
      setIdentity(null);
      setAuthClient(null);
    } else {
      setIdentity(null);
    }
  }, [authClient]);

  const value: AuthContextType = {
    identity,
    isAuthenticated: identity != null,
    isAuthLoading,
    login,
    logout,
    authError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
