import axios, {
	AxiosError,
	AxiosInstance,
	AxiosRequestConfig,
	AxiosResponse,
	InternalAxiosRequestConfig,
} from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const getCsrfTokenFromCookie = (): string | null => {
	if (typeof document === "undefined") return null;
	const match = document.cookie.match(/(?:^|;\s*)csrfToken=([^;]+)/);
	return match ? decodeURIComponent(match[1]) : null;
};

class ApiService {
	private api: AxiosInstance;
	private tokenKey: string = "authToken";
	private currentToken: string | null = null;

	constructor() {
		const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
		const ip =
			Platform.OS === "web" && typeof window !== "undefined"
				? window.location.hostname
				: process.env.EXPO_PUBLIC_BACKEND_IP ?? "192.168.1.4";
		const port = process.env.EXPO_PUBLIC_PORT ?? "3001";
		this.api = axios.create({
			baseURL: apiBaseUrl ?? `http://${ip}:${port}`,
			timeout: 10000,
			headers: {
				"Content-Type": "application/json",
			},
			withCredentials: true,
		});

		this.initialize();
		this.setupInterceptors();
	}

	private async initialize(): Promise<void> {
		try {
			await this.loadToken();
		} catch (error) {
			console.error("Failed to initialize ApiService:", error);
		}
	}

	private async loadToken(): Promise<void> {
		try {
			if (Platform.OS !== "web") {
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

	public async clearToken(): Promise<void> {
		await this.setToken(null);
	}

	private setupInterceptors(): void {
		this.api.interceptors.request.use(
			(config: InternalAxiosRequestConfig) => {
				if (this.currentToken) {
					config.headers.Authorization = `Bearer ${this.currentToken}`;
				}

				if (Platform.OS === "web") {
					const csrfToken = getCsrfTokenFromCookie();
					if (csrfToken) {
						config.headers["X-CSRF-Token"] = csrfToken;
					}
				}

				return config;
			},
			(error: AxiosError) => {
				return Promise.reject(error);
			}
		);

		this.api.interceptors.response.use(
			(response: AxiosResponse) => response,
			async (error: AxiosError) => {
				if (error.response?.status === 401) {
					await this.clearToken();
				}

				if (error.response?.status && error.response.status >= 500) {
					console.error("Server error:", error.response.data);
				}

				return Promise.reject(error);
			}
		);
	}

	public async updateToken(newToken: string | null): Promise<void> {
		await this.setToken(newToken);
	}

	public getToken(): string | null {
		return this.currentToken;
	}

	public isAuthenticated(): boolean {
		return !!this.currentToken;
	}

	public getAxiosInstance(): AxiosInstance {
		return this.api;
	}

	public async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
		return this.api.get<T>(url, config);
	}

	public async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
		return this.api.post<T>(url, data, config);
	}

	public async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
		return this.api.put<T>(url, data, config);
	}

	public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
		return this.api.delete<T>(url, config);
	}
}

const apiService = new ApiService();

export const api = apiService.getAxiosInstance();

export const isAxiosError = axios.isAxiosError;

export const apiMethods = {
	get: <T>(url: string) => apiService.get<T>(url).then((res) => res.data),
	post: <T>(url: string, data?: unknown) =>
		apiService.post<T>(url, data).then((res) => res.data),
	put: <T>(url: string, data?: unknown) =>
		apiService.put<T>(url, data).then((res) => res.data),
	delete: <T>(url: string) => apiService.delete<T>(url).then((res) => res.data),
};

export default apiService;

export const updateToken = (token: string | null) => apiService.updateToken(token);
export const setToken = (token: string | null) => apiService.setToken(token);
export const clearToken = () => apiService.clearToken();
export const isAuthenticated = () => apiService.isAuthenticated();
export const getToken = () => apiService.getToken();
