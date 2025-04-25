import React, { createContext, useContext, useEffect, useState } from "react";
import authStorage from "../utils/authStorage";
import { CurrentUserDto, LoginRequest } from "../api/client";
import { usersClient } from "../api";
import config from "../config";

interface LoginCredentials {
	email: string;
	password: string;
}

interface AuthContextType {
	user: CurrentUserDto | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	loginWithEmail: (credentials: LoginCredentials) => Promise<boolean>;
	loginWithGoogle: () => Promise<boolean>;
	loginWithFacebook: () => Promise<boolean>;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
	user: null,
	isAuthenticated: false,
	isLoading: true,
	loginWithEmail: async () => false,
	loginWithGoogle: async () => false,
	loginWithFacebook: async () => false,
	logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
	children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [user, setUser] = useState<CurrentUserDto | null>(null);
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	useEffect(() => {
		// Check for stored auth token on app load
		const checkAuthState = async () => {
			setIsLoading(true);

			try {
				const token = await authStorage.getToken();

				if (token) {
					const user = await usersClient.getCurrentUser();
					setUser(user);
					setIsAuthenticated(true);
				} else {
					setIsAuthenticated(false);
				}
			} catch (error) {
				console.error("Error checking auth state:", error);
				setUser(null);
				setIsAuthenticated(false);
			} finally {
				setIsLoading(false);
			}
		};

		checkAuthState().then();
	}, []);

	const saveUserData = async (token: string) => {
		try {
			await authStorage.setAuth(token);
		} catch (error) {
			console.error("Error saving auth data:", error);
		}
	};

	const loginWithEmail = async (
		credentials: LoginCredentials,
	): Promise<boolean> => {
		setIsLoading(true);

		try {
			// Pass useCookies, useSessionCookies, and the login payload (credentials)
			const response = await usersClient.postApiUsersLogin({
				email: credentials.email,
				password: credentials.password,
			} as LoginRequest);

			await saveUserData(response.accessToken as string);
			setIsAuthenticated(true);
			return true;
		} catch (error) {
			console.error("Login error:", error);
			setUser(null);
			setIsAuthenticated(false);
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	const loginWithGoogle = async () => {
		setIsLoading(true);

		try {
			window.location.href =
				config.apiUrl +
				"/api/Users/google/login/?returnUrl=" +
				window.location.href;
			return true;
		} catch (error) {
			console.error("Google login error:", error);
			setUser(null);
			setIsAuthenticated(false);
			setIsLoading(false);
			return false;
		}
	};

	const loginWithFacebook = async (): Promise<boolean> => {
		setIsLoading(true);

		try {
			return new Promise((resolve) => {
				setTimeout(() => {
					const mockUser = {
						id: "3",
						name: "Facebook User",
						email: "facebook.user@example.com",
					} as CurrentUserDto;

					const mockToken = "mock-facebook-token-" + Date.now();

					setUser(mockUser);
					setIsAuthenticated(true);
					saveUserData(mockToken);

					setIsLoading(false);
					resolve(true);
				}, 1500);
			});
		} catch (error) {
			console.error("Facebook login error:", error);
			setUser(null);
			setIsAuthenticated(false);
			setIsLoading(false);
			return false;
		}
	};

	const logout = async (): Promise<void> => {
		setIsLoading(true);

		try {
			await authStorage.clearAuth();

			setUser(null);
			setIsAuthenticated(false);
		} catch (error) {
			console.error("Logout error:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				isAuthenticated,
				isLoading,
				loginWithEmail,
				loginWithGoogle,
				loginWithFacebook,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};
