import React, { useState, useEffect } from "react";
import { StyleSheet, View, ScrollView, ActivityIndicator } from "react-native";
import {
	Button,
	Text,
	TextInput,
	RadioButton,
	Card,
	Divider,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainTabParamList, navigate } from "../navigation/AppNavigator";
import { useAuth } from "../contexts/AuthContext";
import { usersClient } from "../api";
import { SetupRequest } from "../api/client";
import userPreferences from "../utils/userPreferences";

export type DisplayNameScreenProps = NativeStackScreenProps<
	MainTabParamList,
	"DisplayName"
>;

const DisplayNameScreen = () => {
	const [displayName, setDisplayName] = useState("");
	const [age, setAge] = useState("");
	const [gender, setGender] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isInitialLoading, setIsInitialLoading] = useState(true);
	const [error, setError] = useState("");
	const { user, fetchUser } = useAuth();

	useEffect(() => {
		const loadExistingData = async () => {
			try {
				if (user?.displayName) {
					setDisplayName(user.displayName);
				}

				const preferences = await userPreferences.getPreferences();
				if (preferences.age) {
					setAge(preferences.age.toString());
				}
				if (preferences.gender) {
					setGender(preferences.gender);
				}
			} catch (error) {
				console.error("Error loading existing data:", error);
			} finally {
				setIsInitialLoading(false);
			}
		};

		loadExistingData();
	}, [user]);

	const handleSubmit = async () => {
		if (!displayName.trim()) {
			setError("Please enter a display name");
			return;
		}

		if (displayName.length < 3) {
			setError("Display name must be at least 3 characters");
			return;
		}

		if (!age.trim()) {
			setError("Please enter your age");
			return;
		}

		const ageNum = parseInt(age);
		if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
			setError("Please enter a valid age between 18 and 100");
			return;
		}

		if (!gender) {
			setError("Please select your gender");
			return;
		}

		setIsLoading(true);
		setError("");

		try {
			if (!user?.setupComplete) {
				await usersClient.completeSetup({
					displayName: displayName.trim(),
					age: parseInt(age),
					gender: gender,
				} as SetupRequest);
			}

			await userPreferences.setPreferences({
				age: ageNum,
				gender: gender as "male" | "female" | "other" | "prefer_not_to_say",
			});

			await fetchUser();
			navigate("Main", {
				screen: "ChatsList",
			});
		} catch (error) {
			console.error("Error setting up profile:", error);
			setError("Failed to set up profile. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	if (isInitialLoading) {
		return (
			<SafeAreaView style={styles.container}>
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#6200ee" />
					<Text style={styles.loadingText}>Loading your profile...</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<View style={styles.content}>
					<Text style={styles.title}>Complete Your Profile</Text>
					<Text style={styles.subtitle}>
						Tell us a bit about yourself to get started
					</Text>

					<Card style={styles.card}>
						<Card.Content>
							<Text style={styles.sectionTitle}>Display Name</Text>
							<TextInput
								label="Display Name"
								value={displayName}
								onChangeText={setDisplayName}
								mode="outlined"
								style={styles.input}
								disabled={isLoading}
								autoFocus
								maxLength={50}
							/>
							<Text style={styles.helperText}>
								Your display name will be visible to other users
							</Text>
						</Card.Content>
					</Card>

					<Card style={styles.card}>
						<Card.Content>
							<Text style={styles.sectionTitle}>Age</Text>
							<TextInput
								label="Age"
								value={age}
								onChangeText={setAge}
								mode="outlined"
								style={styles.input}
								disabled={isLoading}
								keyboardType="numeric"
								maxLength={3}
							/>
							<Text style={styles.helperText}>
								Must be between 18 and 100 years old
							</Text>
						</Card.Content>
					</Card>

					<Card style={styles.card}>
						<Card.Content>
							<Text style={styles.sectionTitle}>Gender</Text>
							<RadioButton.Group onValueChange={setGender} value={gender}>
								<View style={styles.radioOption}>
									<RadioButton value="male" disabled={isLoading} />
									<Text style={styles.radioLabel}>Male</Text>
								</View>
								<View style={styles.radioOption}>
									<RadioButton value="female" disabled={isLoading} />
									<Text style={styles.radioLabel}>Female</Text>
								</View>
								<View style={styles.radioOption}>
									<RadioButton value="other" disabled={isLoading} />
									<Text style={styles.radioLabel}>Other</Text>
								</View>
								<View style={styles.radioOption}>
									<RadioButton value="prefer_not_to_say" disabled={isLoading} />
									<Text style={styles.radioLabel}>Prefer not to say</Text>
								</View>
							</RadioButton.Group>
						</Card.Content>
					</Card>

					{error ? <Text style={styles.errorText}>{error}</Text> : null}

					<Button
						mode="contained"
						onPress={handleSubmit}
						loading={isLoading}
						disabled={
							isLoading || !displayName.trim() || !age.trim() || !gender
						}
						style={styles.button}
					>
						Complete Setup
					</Button>

					<Text style={styles.privacyText}>
						Your age and gender help us match you with appropriate chat
						partners. This information is kept private and secure.
					</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f5f5f5",
	},
	scrollContent: {
		flexGrow: 1,
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
		color: "#333",
	},
	subtitle: {
		fontSize: 16,
		color: "#666",
		marginBottom: 30,
		textAlign: "center",
	},
	card: {
		marginBottom: 16,
		elevation: 2,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "600",
		marginBottom: 12,
		color: "#333",
	},
	input: {
		marginBottom: 8,
		backgroundColor: "white",
	},
	helperText: {
		color: "#666",
		fontSize: 14,
		marginTop: 4,
	},
	radioOption: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 8,
	},
	radioLabel: {
		fontSize: 16,
		marginLeft: 8,
		color: "#333",
	},
	errorText: {
		color: "#d32f2f",
		marginBottom: 16,
		textAlign: "center",
		fontSize: 16,
	},
	button: {
		padding: 5,
		borderRadius: 8,
		marginBottom: 16,
	},
	privacyText: {
		color: "#666",
		fontSize: 12,
		textAlign: "center",
		lineHeight: 18,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	loadingText: {
		marginTop: 10,
		fontSize: 16,
		fontWeight: "bold",
		color: "#6200ee",
	},
});

export default DisplayNameScreen;
