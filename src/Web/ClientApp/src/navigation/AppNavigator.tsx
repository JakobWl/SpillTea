import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, View } from "react-native";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import ChatsListScreen from "../screens/ChatsListScreen";
import ChatScreen from "../screens/ChatScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { useAuth } from "../contexts/AuthContext";

// Define the types for our navigation stack
export type AuthStackParamList = {
	Login: undefined;
	Register: undefined;
	ForgotPassword: undefined;
};

export type MainTabParamList = {
	ChatsList: undefined;
	ChatConversation: {
		chatId: number;
	};
	Profile: undefined;
};

export type RootStackParamList = {
	Auth: undefined;
	Main: undefined;
};

// Create the navigators
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

// Auth Navigator (when user is not logged in)
const AuthNavigator = () => (
	<AuthStack.Navigator initialRouteName="Login">
		<AuthStack.Screen
			name="Login"
			component={LoginScreen}
			options={{ headerShown: false }}
		/>
		<AuthStack.Screen
			name="Register"
			component={RegisterScreen}
			options={{
				headerTitle: "Create Account",
				headerBackTitle: "",
			}}
		/>
		<AuthStack.Screen
			name="ForgotPassword"
			component={ForgotPasswordScreen}
			options={{
				headerTitle: "Reset Password",
				headerBackTitle: "",
			}}
		/>
	</AuthStack.Navigator>
);

// Main Stack Navigator (when user is logged in)
const MainNavigator = () => {
	return (
		<MainStack.Navigator
			initialRouteName="ChatsList"
			screenOptions={{
				headerBackTitle: "",
				headerTitleAlign: "center",
			}}
		>
			<MainStack.Screen
				name="ChatsList"
				component={ChatsListScreen}
				options={({ navigation }) => ({
					title: "Chats",
					headerRight: () => (
						<Ionicons
							name="person-circle-outline"
							size={28}
							color="#6200ee"
							style={{ marginRight: 10 }}
							onPress={() => navigation.navigate("Profile")}
						/>
					),
				})}
			/>
			<MainStack.Screen name="ChatConversation" component={ChatScreen} />
			<MainStack.Screen
				name="Profile"
				component={ProfileScreen}
				options={{ title: "Your Profile" }}
			/>
		</MainStack.Navigator>
	);
};

// Loading component
const LoadingScreen = () => (
	<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
		<ActivityIndicator size="large" color="#6200ee" />
	</View>
);

// Create a navigation ref that can be used outside of components
let navigation: any;

export const setTopLevelNavigator = (nav: any) => {
	navigation = nav;
};

export const navigate = (name: string, params?: any) => {
	if (navigation) {
		navigation.navigate(name, params);
	}
};

// Root Navigator that handles authentication state
const AppNavigator = () => {
	// Get auth state from context
	const { isAuthenticated, isLoading } = useAuth();

	if (isLoading) {
		return <LoadingScreen />;
	}

	return (
		<RootStack.Navigator screenOptions={{ headerShown: false }}>
			{isAuthenticated ? (
				<RootStack.Screen name="Main" component={MainNavigator} />
			) : (
				<RootStack.Screen name="Auth" component={AuthNavigator} />
			)}
		</RootStack.Navigator>
	);
};

export default AppNavigator;
