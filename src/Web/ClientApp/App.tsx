import React, { useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
	NavigationContainer,
	NavigationContainerRef,
} from "@react-navigation/native";
import { MD3LightTheme, Provider as PaperProvider } from "react-native-paper";
import AppNavigator, {
	setTopLevelNavigator,
} from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/contexts/AuthContext";
// Import to ensure proper loading of icons
import "./src/utils/materialIcons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function App() {
	const navigationRef = useRef<NavigationContainerRef<any>>(null);
	const queryClient = new QueryClient();

	return (
		<QueryClientProvider client={queryClient}>
			<SafeAreaProvider>
				<PaperProvider theme={MD3LightTheme}>
					<AuthProvider>
						<NavigationContainer
							ref={navigationRef}
							onReady={() => {
								setTopLevelNavigator(navigationRef.current);
							}}
						>
							<AppNavigator />
							<StatusBar style="auto" />
						</NavigationContainer>
					</AuthProvider>
				</PaperProvider>
			</SafeAreaProvider>
		</QueryClientProvider>
	);
}
