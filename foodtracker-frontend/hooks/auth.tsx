import apiService, { isAxiosError, updateToken } from "@/lib/api";
import { AuthResult } from "@/types/auth/authResult";
import { CreateUserDto } from "@/types/users/createuser";
import { createContext, PropsWithChildren, useContext, useEffect } from "react";

import { LoginDto } from "../types/auth/login";
import { useStorageState } from "./useStorageState";

// hooks/auth.tsx

const AuthContext = createContext<{
  signIn: (loginDto: LoginDto) => Promise<AuthResult>;
  createAccount: (createUserDto: CreateUserDto) => Promise<AuthResult>;
  signOut: () => void;
  session?: string | null;
  isLoading: boolean;
}>({
  signIn: async (loginDto: LoginDto): Promise<AuthResult> => {
    throw new Error("Not implemented");
  },
  createAccount: async (createUserDto: CreateUserDto): Promise<AuthResult> => {
    throw new Error("Not implemented");
  },
  signOut: () => {},
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

  // Update API service token whenever session changes
  useEffect(() => {
    // Update the centralized API service with the current session token
    updateToken(session);
  }, [session]);

  const signIn = async (loginDto: LoginDto): Promise<AuthResult> => {
    try {
      console.log("Attempting login with:", { email: loginDto.email }); // Don't log password
      console.log("API base URL:", apiService.getAxiosInstance().defaults.baseURL);

      const response = await apiService.post<AuthResult>("/auth/login", loginDto);

      console.log("Login response status:", response.status);
      console.log("Login response data:", response.data);

      const authResult = response.data;

      if (authResult?.accessToken) {
        // Set session in storage (useStorageState)
        setSession(authResult.accessToken);
        // The useEffect above will automatically update the API service token
      }

      return authResult;
    } catch (error) {
      console.error("Login error details:", error);

      if (isAxiosError(error)) {
        console.log(error.response);
        console.log(error.cause);
        console.log(error.code);
        console.error("Axios error response:", error.response?.data);
        console.error("Axios error status:", error.response?.status);
        console.error("Axios error message:", error.message);

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

  const signOut = () => {
    // Clear session from storage (useStorageState)
    setSession(null);
    // The useEffect above will automatically clear the API service token
  };

  return (
    <AuthContext.Provider
      value={{
        signIn,
        createAccount,
        signOut,
        session,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
