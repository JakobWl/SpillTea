import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import authStorage from "../utils/authStorage";
import { CurrentUserDto, LoginRequest } from "../api/client";
import { usersClient } from "../api";
import config from "../config";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { MainTabParamList, navigate } from "../navigation/AppNavigator";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri, useAuthRequest } from "expo-auth-session";
import { Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

const discovery = {
	authorizationEndpoint: `${config.apiUrl}/api/Users/google/login`,
};

const facebookDiscovery = {
	authorizationEndpoint: `${config.apiUrl}/api/Users/facebook/login`,
};

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
	fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
	user: null,
	isAuthenticated: false,
	isLoading: true,
	loginWithEmail: async () => false,
	loginWithGoogle: async () => false,
	loginWithFacebook: async () => false,
	logout: async () => {},
	fetchUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
	children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [user, setUser] = useState<CurrentUserDto | null>(null);
	const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const redirectUri = makeRedirectUri({
		scheme: "fadechat",
		path: "login",
	});

	const [request, response, promptAsync] = useAuthRequest(
		{
			clientId: "doesnt-matter", // Not used in this flow
			redirectUri,
			scopes: [],
			usePKCE: false,
		},
		discovery,
	);

	const [facebookRequest, facebookResponse, promptFacebookAsync] =
		useAuthRequest(
			{
				clientId: "doesnt-matter",
				redirectUri,
				scopes: [],
				usePKCE: false,
			},
			facebookDiscovery,
		);

	const fetchUser = useCallback(async () => {
		console.log("Attempting to fetch current user...");
		try {
			const currentUser = await usersClient.getCurrentUser();
			setUser(currentUser);
			setIsAuthenticated(true);
			await authStorage.setUser(currentUser);
		} catch (error) {
			setUser(null);
			setIsAuthenticated(false);
			await authStorage.clearUser();
		}
	}, []);

	useEffect(() => {
		const handleAuthResponse = async () => {
			if (response || facebookResponse) {
				const currentResponse = response || facebookResponse;
				if (currentResponse?.type === "success") {
					await fetchUser();
				} else if (currentResponse?.type === "error") {
					console.error("Authentication error:", currentResponse.error);
				}
				setIsLoading(false);
			}
		};

		handleAuthResponse();
	}, [response, facebookResponse, fetchUser]);

	useEffect(() => {
		const checkAuthState = async () => {
			setIsLoading(true);
			await fetchUser();
			setIsLoading(false);
		};

		checkAuthState();
	}, [fetchUser]);

	const loginWithEmail = async (
		credentials: LoginCredentials,
	): Promise<boolean> => {
		setIsLoading(true);
		try {
			await usersClient.postApiUsersLogin({
				email: credentials.email,
				password: credentials.password,
			} as LoginRequest);

			await fetchUser();
			console.log("Login successful, user fetched.");
			return true;
		} catch (error) {
			console.error("Login error:", error);
			setUser(null);
			setIsAuthenticated(false);
			await authStorage.clearUser();
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	const loginWithGoogle = async () => {
		if (Platform.OS !== "web") {
			setIsLoading(true);
			await promptAsync({
				url: `${config.apiUrl}/api/Users/google/login?returnUrl=${redirectUri}`,
			});
			return true;
		} else {
			try {
				const returnUrl = window.location.href;
				window.location.href = `${config.apiUrl}/api/Users/google/login?returnUrl=${returnUrl}`;
				return true;
			} catch (error) {
				console.error("Google login initiation error:", error);
				return false;
			}
		}
	};

	const loginWithFacebook = async (): Promise<boolean> => {
		if (Platform.OS !== "web") {
			setIsLoading(true);
			await promptFacebookAsync({
				url: `${config.apiUrl}/api/Users/facebook/login?returnUrl=${redirectUri}`,
			});
			return true;
		} else {
			try {
				const returnUrl = window.location.href;
				window.location.href = `${config.apiUrl}/api/Users/facebook/login?returnUrl=${returnUrl}`;
				return true;
			} catch (error) {
				console.error("Facebook login initiation error:", error);
				return false;
			}
		}
	};

	const logout = async (): Promise<void> => {
		setIsLoading(true);
		try {
			await usersClient.logout();
		} catch (error) {
			console.error("Server logout error:", error);
		} finally {
			setUser(null);
			setIsAuthenticated(false);
			await authStorage.clearUser();
			setIsLoading(false);
			console.log("Client state cleared.");
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
				fetchUser,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};
