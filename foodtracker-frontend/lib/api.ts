import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

interface ApiError extends AxiosError {
  config: InternalAxiosRequestConfig & { _retry?: boolean };
}

class ApiService {
  private api: AxiosInstance;
  private tokenKey: string = "authToken";
  private currentToken: string | null = null;

  constructor() {
    // Create axios instance with base configuration
    this.api = axios.create({
      baseURL: "http://10.0.0.83:3000/",
      timeout: 10000, // 10 seconds
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Initialize token and set up interceptors
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Load token on initialization
      await this.loadToken();
    } catch (error) {
      console.error("Failed to initialize ApiService:", error);
    }
  }

  private async loadToken(): Promise<void> {
    try {
      if (Platform.OS === "web") {
        // Web platform
        if (typeof window !== "undefined" && window.localStorage) {
          this.currentToken = localStorage.getItem(this.tokenKey);
        }
      } else {
        // Native platforms (iOS/Android)
        this.currentToken = await SecureStore.getItemAsync(this.tokenKey);
      }
    } catch (error) {
      console.error("Failed to load token from storage:", error);
      this.currentToken = null;
    }
  }

  public async setToken(token: string | null): Promise<void> {
    this.currentToken = token;

    try {
      if (Platform.OS === "web") {
        // Web platform
        if (typeof window !== "undefined" && window.localStorage) {
          if (token === null) {
            localStorage.removeItem(this.tokenKey);
          } else {
            localStorage.setItem(this.tokenKey, token);
          }
        }
      } else {
        // Native platforms (iOS/Android)
        if (token === null) {
          await SecureStore.deleteItemAsync(this.tokenKey);
        } else {
          await SecureStore.setItemAsync(this.tokenKey, token);
        }
      }
    } catch (error) {
      console.error("Failed to store token:", error);
    }
  }

  public async clearToken(): Promise<void> {
    await this.setToken(null);
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Get the token from storage automatically
        if (this.currentToken) {
          config.headers.Authorization = `Bearer ${this.currentToken}`;
        }

        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for global error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: ApiError) => {
        const originalRequest = error.config;

        // Handle common errors globally
        if (error.response?.status === 401) {
          // Handle unauthorized - clear token and prevent retry loop
          if (!originalRequest?._retry) {
            if (originalRequest) {
              originalRequest._retry = true;
            }

            // Clear the invalid token
            await this.clearToken();

            // Handle unauthorized - maybe clear session and redirect to login
            console.log("Unauthorized - redirecting to login");

            // You can emit an event or use navigation service here
            // Example: EventEmitter.emit('unauthorized');
            // Example: navigationRef.navigate('Login');
          }
        }

        if (error.response?.status && error.response.status >= 500) {
          // Handle server errors
          console.error("Server error:", error.response.data);
        }

        return Promise.reject(error);
      }
    );
  }

  // Method to update token from anywhere in your app
  public async updateToken(newToken: string | null): Promise<void> {
    await this.setToken(newToken);
  }

  // Get current token
  public getToken(): string | null {
    return this.currentToken;
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    return !!this.currentToken;
  }

  // Get the underlying axios instance if needed for advanced usage
  public getAxiosInstance(): AxiosInstance {
    return this.api;
  }

  // Direct access to axios methods (maintaining your original interface)
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.get<T>(url, config);
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.post<T>(url, data, config);
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.put<T>(url, data, config);
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.api.delete<T>(url, config);
  }
}

// Create and export a singleton instance
const apiService = new ApiService();

// Export the main API instance (maintains compatibility with your existing code)
export const api = apiService.getAxiosInstance();

// Export axios error checker
export const isAxiosError = axios.isAxiosError;

// Export API methods that return data directly (maintains your existing interface)
export const apiMethods = {
  get: <T>(url: string) => apiService.get<T>(url).then((res) => res.data),
  post: <T>(url: string, data?: any) => apiService.post<T>(url, data).then((res) => res.data),
  put: <T>(url: string, data?: any) => apiService.put<T>(url, data).then((res) => res.data),
  delete: <T>(url: string) => apiService.delete<T>(url).then((res) => res.data),
};

// Export the service for token management
export default apiService;

// Export token management methods with proper binding to maintain 'this' context
export const updateToken = (token: string | null) => apiService.updateToken(token);
export const setToken = (token: string | null) => apiService.setToken(token);
export const clearToken = () => apiService.clearToken();
export const isAuthenticated = () => apiService.isAuthenticated();
export const getToken = () => apiService.getToken();
