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
		try {
			const returnUrl = window.location.href;
			window.location.href = `${config.apiUrl}/api/Users/google/login?returnUrl=${returnUrl}`;
			return true;
		} catch (error) {
			console.error("Google login initiation error:", error);
			setIsLoading(false);
			return false;
		}
	};

	const loginWithFacebook = async (): Promise<boolean> => {
		try {
			const returnUrl = window.location.href;
			window.location.href = `${config.apiUrl}/api/Users/facebook/login?returnUrl=${returnUrl}`;
			return true;
		} catch (error) {
			console.error("Facebook login initiation error:", error);
			return false;
		}
	};

	const logout = async (): Promise<void> => {
		setIsLoading(true);
		try {
			// Call the server endpoint to clear HttpOnly cookies
			// Assuming an endpoint like /api/Users/logout exists and uses POST
			// TODO: Uncomment and ensure client is regenerated after creating the backend endpoint
			await usersClient.logout();
			// console.log("Logout requested (server call commented out for now).");
		} catch (error) {
			console.error("Server logout error:", error);
			// Proceed to clear client state even if server call fails?
			// Depending on requirements, maybe don't clear state if server fails.
		} finally {
			// Clear client-side state regardless of server success/failure for now
			setUser(null);
			setIsAuthenticated(false);
			await authStorage.clearUser(); // Clear local user storage
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
