import React, { useState, useEffect } from "react";
import { ScrollView, StyleSheet, View, Alert } from "react-native";
import {
	Button,
	Card,
	Divider,
	Text,
	Switch,
	Checkbox,
	TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainTabParamList } from "../navigation/AppNavigator";
import userPreferences, { UserPreferences } from "../utils/userPreferences";
import signalRService, { SearchFilters } from "../services/signalRService";
import { useNavigation } from "@react-navigation/native";

type SearchFiltersScreenProps = NativeStackScreenProps<
	MainTabParamList,
	"ChatsList"
>;

const SearchFiltersScreen = () => {
	const navigation = useNavigation();
	const [preferences, setPreferences] = useState<UserPreferences>({
		notificationsEnabled: true,
		soundEnabled: true,
		theme: "system",
	});
	const [isLoading, setIsLoading] = useState(false);
	const [isFindingChat, setIsFindingChat] = useState(false);

	// Search filter states
	const [ageRangeEnabled, setAgeRangeEnabled] = useState(false);
	const [minAge, setMinAge] = useState(18);
	const [maxAge, setMaxAge] = useState(65);
	const [genderPreferences, setGenderPreferences] = useState<string[]>([]);
	const [sameAgeGroupOnly, setSameAgeGroupOnly] = useState(false);

	useEffect(() => {
		loadPreferences();
	}, []);

	const loadPreferences = async () => {
		try {
			const userPrefs = await userPreferences.getPreferences();
			setPreferences(userPrefs);

			// Load search filters if they exist
			if (userPrefs.searchFilters) {
				setAgeRangeEnabled(userPrefs.searchFilters.ageRangeEnabled);
				setMinAge(userPrefs.searchFilters.minAge);
				setMaxAge(userPrefs.searchFilters.maxAge);
				setGenderPreferences(userPrefs.searchFilters.genderPreferences);
				setSameAgeGroupOnly(userPrefs.searchFilters.sameAgeGroupOnly);
			}
		} catch (error) {
			console.error("Error loading preferences:", error);
		}
	};

	const saveFilters = async () => {
		setIsLoading(true);
		try {
			const searchFilters = {
				ageRangeEnabled,
				minAge,
				maxAge,
				genderPreferences,
				sameAgeGroupOnly,
			};

			await userPreferences.setPreferences({
				searchFilters,
			});

			Alert.alert("Success", "Search preferences saved!");
		} catch (error) {
			console.error("Error saving search filters:", error);
			Alert.alert("Error", "Failed to save search preferences.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleGenderToggle = (gender: string) => {
		setGenderPreferences((prev) =>
			prev.includes(gender)
				? prev.filter((g) => g !== gender)
				: [...prev, gender],
		);
	};

	const findChatWithFilters = async () => {
		if (!preferences.age || !preferences.gender) {
			Alert.alert(
				"Profile Incomplete",
				"Please complete your age and gender in your profile first.",
			);
			return;
		}

		setIsFindingChat(true);
		try {
			const filters: SearchFilters = {
				ageRangeEnabled,
				minAge,
				maxAge,
				genderPreferences,
				sameAgeGroupOnly,
			};

			const chatId = await signalRService.findRandomChatWithFilters(filters);

			// Navigate to the chat conversation
			(navigation as any).navigate("ChatConversation", {
				chatId: chatId,
			});
		} catch (error: any) {
			console.error("Error finding filtered chat:", error);
			Alert.alert(
				"Error",
				error.message || "Failed to find chat with your preferences.",
			);
		} finally {
			setIsFindingChat(false);
		}
	};

	const findRandomChat = async () => {
		setIsFindingChat(true);
		try {
			const chatId = await signalRService.findRandomChat();

			// Navigate to the chat conversation
			(navigation as any).navigate("ChatConversation", {
				chatId: chatId,
			});
		} catch (error: any) {
			console.error("Error finding random chat:", error);
			Alert.alert("Error", error.message || "Failed to find random chat.");
		} finally {
			setIsFindingChat(false);
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView>
				<View style={styles.header}>
					<Text style={styles.title}>Find Chat Partner</Text>
					<Text style={styles.subtitle}>
						Configure your preferences or find anyone
					</Text>
				</View>

				{/* Profile Status */}
				<Card style={styles.card}>
					<Card.Title title="Your Profile" />
					<Card.Content>
						<Text style={styles.profileText}>
							Age:{" "}
							{preferences.age ? `${preferences.age} years old` : "Not set"}
						</Text>
						<Text style={styles.profileText}>
							Gender:{" "}
							{preferences.gender
								? preferences.gender
										.replace("_", " ")
										.replace(/\b\w/g, (l) => l.toUpperCase())
								: "Not set"}
						</Text>
						{(!preferences.age || !preferences.gender) && (
							<Text style={styles.warningText}>
								⚠️ Complete your profile to use advanced search
							</Text>
						)}
					</Card.Content>
				</Card>

				{/* Age Range Filter */}
				<Card style={styles.card}>
					<Card.Title title="Age Range" />
					<Card.Content>
						<View style={styles.switchRow}>
							<Text style={styles.switchLabel}>Filter by age range</Text>
							<Switch
								value={ageRangeEnabled}
								onValueChange={setAgeRangeEnabled}
								disabled={!preferences.age}
							/>
						</View>

						{ageRangeEnabled && (
							<>
								<Divider style={styles.divider} />
								<Text style={styles.rangeText}>
									Age range: {minAge} - {maxAge} years
								</Text>
								<TextInput
									label="Minimum age"
									value={minAge.toString()}
									onChangeText={(text) => setMinAge(parseInt(text) || 18)}
									mode="outlined"
									keyboardType="numeric"
									disabled={!ageRangeEnabled}
									style={styles.ageInput}
								/>
								<TextInput
									label="Maximum age"
									value={maxAge.toString()}
									onChangeText={(text) => setMaxAge(parseInt(text) || 100)}
									mode="outlined"
									keyboardType="numeric"
									disabled={!ageRangeEnabled}
									style={styles.ageInput}
								/>
							</>
						)}
					</Card.Content>
				</Card>

				{/* Gender Preferences */}
				<Card style={styles.card}>
					<Card.Title title="Gender Preferences" />
					<Card.Content>
						<Text style={styles.sectionDescription}>
							Select which genders you'd like to chat with (leave empty for any)
						</Text>
						<View style={styles.checkboxContainer}>
							<Checkbox.Item
								label="Male"
								status={
									genderPreferences.includes("male") ? "checked" : "unchecked"
								}
								onPress={() => handleGenderToggle("male")}
								disabled={!preferences.age || !preferences.gender}
							/>
							<Checkbox.Item
								label="Female"
								status={
									genderPreferences.includes("female") ? "checked" : "unchecked"
								}
								onPress={() => handleGenderToggle("female")}
								disabled={!preferences.age || !preferences.gender}
							/>
							<Checkbox.Item
								label="Other"
								status={
									genderPreferences.includes("other") ? "checked" : "unchecked"
								}
								onPress={() => handleGenderToggle("other")}
								disabled={!preferences.age || !preferences.gender}
							/>
							<Checkbox.Item
								label="Prefer not to say"
								status={
									genderPreferences.includes("prefer_not_to_say")
										? "checked"
										: "unchecked"
								}
								onPress={() => handleGenderToggle("prefer_not_to_say")}
								disabled={!preferences.age || !preferences.gender}
							/>
						</View>
					</Card.Content>
				</Card>

				{/* Additional Filters */}
				<Card style={styles.card}>
					<Card.Title title="Additional Filters" />
					<Card.Content>
						<View style={styles.switchRow}>
							<View style={styles.switchInfo}>
								<Text style={styles.switchLabel}>Similar age group</Text>
								<Text style={styles.switchDescription}>
									Match with people within 5 years of your age
								</Text>
							</View>
							<Switch
								value={sameAgeGroupOnly}
								onValueChange={setSameAgeGroupOnly}
								disabled={!preferences.age}
							/>
						</View>
					</Card.Content>
				</Card>

				{/* Action Buttons */}
				<View style={styles.buttonContainer}>
					<Button
						mode="contained"
						onPress={saveFilters}
						loading={isLoading}
						disabled={isLoading || isFindingChat}
						style={styles.button}
					>
						Save Preferences
					</Button>

					<Button
						mode="contained"
						onPress={findChatWithFilters}
						loading={isFindingChat}
						disabled={
							isLoading ||
							isFindingChat ||
							!preferences.age ||
							!preferences.gender
						}
						style={[styles.button, styles.primaryButton]}
					>
						Find Chat with Filters
					</Button>

					<Button
						mode="outlined"
						onPress={findRandomChat}
						loading={isFindingChat}
						disabled={isLoading || isFindingChat}
						style={styles.button}
					>
						Find Any Chat
					</Button>
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
	header: {
		padding: 20,
		alignItems: "center",
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#333",
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: "#666",
		textAlign: "center",
	},
	card: {
		margin: 16,
		marginTop: 8,
	},
	profileText: {
		fontSize: 16,
		color: "#333",
		marginBottom: 4,
	},
	warningText: {
		color: "#ff9800",
		fontSize: 14,
		marginTop: 8,
		fontWeight: "500",
	},
	switchRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 8,
	},
	switchInfo: {
		flex: 1,
		marginRight: 16,
	},
	switchLabel: {
		fontSize: 16,
		fontWeight: "500",
		color: "#333",
	},
	switchDescription: {
		fontSize: 14,
		color: "#666",
		marginTop: 2,
	},
	divider: {
		marginVertical: 12,
	},
	rangeText: {
		fontSize: 16,
		fontWeight: "500",
		color: "#333",
		marginBottom: 16,
		textAlign: "center",
	},
	sliderLabel: {
		fontSize: 14,
		color: "#666",
		marginBottom: 8,
	},
	slider: {
		width: "100%",
		height: 40,
		marginBottom: 16,
	},
	sectionDescription: {
		fontSize: 14,
		color: "#666",
		marginBottom: 12,
	},
	checkboxContainer: {
		marginTop: 8,
	},
	buttonContainer: {
		padding: 16,
		paddingBottom: 32,
	},
	button: {
		marginVertical: 8,
		paddingVertical: 4,
	},
	primaryButton: {
		backgroundColor: "#6200ee",
	},
	ageInput: {
		marginVertical: 8,
	},
});

export default SearchFiltersScreen;
