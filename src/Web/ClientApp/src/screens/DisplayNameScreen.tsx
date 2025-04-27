import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainTabParamList, navigate } from "../navigation/AppNavigator";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { usersClient } from "../api";
import { SetupRequest } from "../api/client";

export type DisplayNameScreenProps = NativeStackScreenProps<
	MainTabParamList,
	"DisplayName"
>;

const DisplayNameScreen = () => {
	const [displayName, setDisplayName] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const { fetchUser } = useAuth();

	const handleSubmit = async () => {
		if (!displayName.trim()) {
			setError("Please enter a display name");
			return;
		}

		if (displayName.length < 3) {
			setError("Display name must be at least 3 characters");
			return;
		}

		// You might want to add more validation (e.g., no special characters)

		setIsLoading(true);
		setError("");

		try {
			await usersClient.completeSetup({
				displayName: displayName.trim(),
			} as SetupRequest);

			await fetchUser();
			navigate("Main", {
				screen: "ChatsList",
			});
		} catch (error) {
			console.error("Error setting display name:", error);
			setError("Failed to set display name. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>Complete Your Profile</Text>
				<Text style={styles.subtitle}>
					Choose a display name for your account
				</Text>

				<TextInput
					label="Display Name"
					value={displayName}
					onChangeText={setDisplayName}
					mode="outlined"
					style={styles.input}
					disabled={isLoading}
					autoFocus
					maxLength={50} // Match your backend validation
					onSubmitEditing={handleSubmit}
				/>

				{error ? <Text style={styles.errorText}>{error}</Text> : null}

				<Text style={styles.helperText}>
					Your display name will be visible to other users. You can't change it
					later.
				</Text>

				<Button
					mode="contained"
					onPress={handleSubmit}
					loading={isLoading}
					disabled={isLoading || !displayName.trim()}
					style={styles.button}
				>
					Continue
				</Button>
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f5f5f5",
	},
	content: {
		flex: 1,
		padding: 20,
		justifyContent: "center",
	},
	title: {
		fontSize: 28,
		fontWeight: "bold",
		marginBottom: 8,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 16,
		color: "#666",
		marginBottom: 30,
		textAlign: "center",
	},
	input: {
		marginBottom: 8,
		backgroundColor: "white",
	},
	helperText: {
		color: "#666",
		fontSize: 14,
		marginBottom: 20,
	},
	errorText: {
		color: "red",
		marginBottom: 8,
	},
	button: {
		padding: 5,
		borderRadius: 8,
	},
});

export default DisplayNameScreen;
