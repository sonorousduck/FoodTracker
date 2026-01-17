import axios, {
	AxiosError,
	AxiosInstance,
	AxiosRequestConfig,
	AxiosResponse,
	InternalAxiosRequestConfig,
} from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

interface ApiError extends AxiosError {
	config: InternalAxiosRequestConfig & { _retry?: boolean; skipAuthRefresh?: boolean };
}

type AxiosRequestConfigWithAuth = AxiosRequestConfig & {
	skipAuthRefresh?: boolean;
};

class ApiService {
	private api: AxiosInstance;
	private tokenKey: string = "authToken";
	private refreshTokenKey: string = "refreshToken";
	private currentToken: string | null = null;
	private currentRefreshToken: string | null = null;

	constructor() {
		// Create axios instance with base configuration
		const ip =
			Platform.OS === "web" && typeof window !== "undefined"
				? window.location.hostname
				: process.env.EXPO_PUBLIC_BACKEND_IP ?? "192.168.1.4";
		const port = process.env.EXPO_PUBLIC_PORT ?? "3001";
		this.api = axios.create({
			baseURL: `http://${ip}:${port}`,
			timeout: 10000, // 10 seconds
			headers: {
				"Content-Type": "application/json",
			},
			withCredentials: true,
		});

		// Initialize token and set up interceptors
		this.initialize();
		this.setupInterceptors();
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
				if (Platform.OS !== "web") {
					this.currentToken = await SecureStore.getItemAsync(this.tokenKey);
					this.currentRefreshToken = await SecureStore.getItemAsync(this.refreshTokenKey);
				}
			} catch (error) {
				console.error("Failed to load token from storage:", error);
				this.currentToken = null;
				this.currentRefreshToken = null;
			}
		}

	public async setToken(token: string | null): Promise<void> {
		this.currentToken = token;

		try {
			if (Platform.OS !== "web") {
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

	public async setRefreshToken(token: string | null): Promise<void> {
		this.currentRefreshToken = token;
		if (Platform.OS === "web") {
			return;
		}
		if (token === null) {
			await SecureStore.deleteItemAsync(this.refreshTokenKey);
		} else {
			await SecureStore.setItemAsync(this.refreshTokenKey, token);
		}
	}

	public async clearToken(): Promise<void> {
		await this.setToken(null);
	}

	public async clearRefreshToken(): Promise<void> {
		await this.setRefreshToken(null);
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
					if (!originalRequest?._retry && !originalRequest?.skipAuthRefresh) {
						if (originalRequest) {
							originalRequest._retry = true;
						}

						const refreshed = await this.tryRefreshToken();
						if (refreshed) {
							if (originalRequest.headers) {
								originalRequest.headers.Authorization = `Bearer ${refreshed}`;
							} else {
								originalRequest.headers = {
									Authorization: `Bearer ${refreshed}`,
								} as InternalAxiosRequestConfig["headers"];
							}
							return this.api(originalRequest);
						}

						await this.clearToken();
						await this.clearRefreshToken();
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

	private async tryRefreshToken(): Promise<string | null> {
		try {
			if (Platform.OS === "web") {
				const response = await this.api.post<{ accessToken: string }>(
					"/auth/refresh",
					undefined,
					{
						withCredentials: true,
						skipAuthRefresh: true,
					} as AxiosRequestConfigWithAuth
				);
				if (response?.data?.accessToken) {
					await this.setToken(response.data.accessToken);
					return response.data.accessToken;
				}
				return null;
			}

				if (!this.currentRefreshToken) {
					return null;
				}

				const response = await this.api.post<{ accessToken: string; refreshToken?: string }>(
					"/auth/refresh",
					{ refreshToken: this.currentRefreshToken },
					{ skipAuthRefresh: true } as AxiosRequestConfigWithAuth
				);
				if (response?.data?.accessToken) {
					await this.setToken(response.data.accessToken);
					if (response.data.refreshToken) {
						await this.setRefreshToken(response.data.refreshToken);
					}
					return response.data.accessToken;
				}
				return null;
			} catch (refreshError) {
			return null;
		}
	}

	// Method to update token from anywhere in your app
	public async updateToken(newToken: string | null): Promise<void> {
		await this.setToken(newToken);
	}

	public async updateRefreshToken(newToken: string | null): Promise<void> {
		await this.setRefreshToken(newToken);
	}

	// Get current token
	public getToken(): string | null {
		return this.currentToken;
	}

	public getRefreshToken(): string | null {
		return this.currentRefreshToken;
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
	public async get<T>(
		url: string,
		config?: AxiosRequestConfig
	): Promise<AxiosResponse<T>> {
		return this.api.get<T>(url, config);
	}

	public async post<T>(
		url: string,
		data?: any,
		config?: AxiosRequestConfig
	): Promise<AxiosResponse<T>> {
		return this.api.post<T>(url, data, config);
	}

	public async put<T>(
		url: string,
		data?: any,
		config?: AxiosRequestConfig
	): Promise<AxiosResponse<T>> {
		return this.api.put<T>(url, data, config);
	}

	public async delete<T>(
		url: string,
		config?: AxiosRequestConfig
	): Promise<AxiosResponse<T>> {
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
	post: <T>(url: string, data?: any) =>
		apiService.post<T>(url, data).then((res) => res.data),
	put: <T>(url: string, data?: any) =>
		apiService.put<T>(url, data).then((res) => res.data),
	delete: <T>(url: string) => apiService.delete<T>(url).then((res) => res.data),
};

// Export the service for token management
export default apiService;

// Export token management methods with proper binding to maintain 'this' context
export const updateToken = (token: string | null) =>
	apiService.updateToken(token);
export const updateRefreshToken = (token: string | null) =>
	apiService.updateRefreshToken(token);
export const setToken = (token: string | null) => apiService.setToken(token);
export const clearToken = () => apiService.clearToken();
export const isAuthenticated = () => apiService.isAuthenticated();
export const getToken = () => apiService.getToken();
