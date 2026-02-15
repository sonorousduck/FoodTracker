import apiService, { isAxiosError, updateToken } from "@/lib/api";
import { AuthResult } from "@/types/auth/authResult";
import { CreateUserDto } from "@/types/users/createuser";
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

import { LoginDto } from "../types/auth/login";
import { useStorageState } from "./useStorageState";

// hooks/auth.tsx

const AuthContext = createContext<{
  signIn: (loginDto: LoginDto) => Promise<AuthResult>;
  createAccount: (createUserDto: CreateUserDto) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  session?: string | null;
  isLoading: boolean;
}>({
  signIn: async (loginDto: LoginDto): Promise<AuthResult> => {
    throw new Error("Not implemented");
  },
  createAccount: async (createUserDto: CreateUserDto): Promise<AuthResult> => {
    throw new Error("Not implemented");
  },
  signOut: async () => {},
  session: null,
  isLoading: false,
});

export function useSession() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useSession must be wrapped in a <SessionProvider />");
  }
  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState("session");
  const [isWebSessionLoading, setIsWebSessionLoading] = useState(Platform.OS === "web");

  // Update API service token whenever session changes
  useEffect(() => {
    if (Platform.OS !== "web") {
      updateToken(session);
    }
  }, [session]);

  const hydrateWebSession = useCallback(async () => {
    if (Platform.OS !== "web") {
      return;
    }
    try {
      await apiService.get("/auth/user", { withCredentials: true });
      setSession("cookie");
    } catch (error) {
      setSession(null);
    } finally {
      setIsWebSessionLoading(false);
    }
  }, [setSession]);

  useEffect(() => {
    hydrateWebSession();
  }, [hydrateWebSession]);

  const signIn = async (loginDto: LoginDto): Promise<AuthResult> => {
    try {
      const response = await apiService.post<AuthResult>("/auth/login", loginDto);

      const authResult = response.data;

      if (authResult?.accessToken) {
        if (Platform.OS === "web") {
          setSession("cookie");
        } else {
          setSession(authResult.accessToken);
        }
      }

      return authResult;
    } catch (error) {
      console.error("Login error details:", error);

      if (isAxiosError(error)) {
        const message = error.response?.data?.message || error.message || "Login failed";
        throw new Error(message);
      }

      console.error("Non-axios error:", error);
      throw new Error("An unexpected error occurred");
    }
  };

  const createAccount = async (createUserDto: CreateUserDto): Promise<AuthResult> => {
    try {
      await apiService.post("/auth/create", createUserDto);

      // Auto-sign in after successful registration
      return await signIn({ email: createUserDto.email, password: createUserDto.password });
    } catch (error) {
      if (isAxiosError(error)) {
        const message = error.response?.data?.message || "Registration failed";
        throw new Error(message);
      }
      throw new Error("An unexpected error occurred");
    }
  };

  const signOut = async () => {
    try {
      await apiService.post("/auth/logout");
    } catch (error) {
      if (!isAxiosError(error)) {
        console.error("Failed to log out:", error);
      }
    } finally {
      setSession(null);
      await updateToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        signIn,
        createAccount,
        signOut,
        session,
        isLoading: isLoading || isWebSessionLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
