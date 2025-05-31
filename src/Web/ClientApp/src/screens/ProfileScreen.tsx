import React, { useState, useEffect } from "react";
import { ScrollView, StyleSheet, View, Alert } from "react-native";
import {
	Avatar,
	Button,
	Card,
	Divider,
	Text,
	TextInput,
	Switch,
	List,
	Dialog,
	Portal,
	ActivityIndicator,
	RadioButton,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { usersClient } from "../api";
import { InfoRequest } from "../api/client";
import userPreferences, { UserPreferences } from "../utils/userPreferences";

const ProfileScreen = () => {
	const { user, logout, fetchUser } = useAuth();
	const [isEditing, setIsEditing] = useState(false);
	const [isEditingDemographics, setIsEditingDemographics] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [showPasswordDialog, setShowPasswordDialog] = useState(false);
	const [showLogoutDialog, setShowLogoutDialog] = useState(false);

	// Form states
	const [displayName, setDisplayName] = useState(user?.displayName || "");
	const [newEmail, setNewEmail] = useState("");
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	// Demographics editing states
	const [tempAge, setTempAge] = useState("");
	const [tempGender, setTempGender] = useState("");

	// Settings states
	const [preferences, setPreferences] = useState<UserPreferences>({
		notificationsEnabled: true,
		soundEnabled: true,
		theme: "system",
	});

	const handleSaveProfile = async () => {
		if (!newEmail && !newPassword) {
			Alert.alert("No Changes", "Please make some changes before saving.");
			return;
		}

		if (newPassword && newPassword !== confirmPassword) {
			Alert.alert("Error", "New passwords don't match.");
			return;
		}

		if ((newEmail || newPassword) && !currentPassword) {
			Alert.alert("Error", "Current password is required to make changes.");
			return;
		}

		setIsLoading(true);
		try {
			const request = new InfoRequest({
				oldPassword: currentPassword,
				newEmail: newEmail || undefined,
				newPassword: newPassword || undefined,
			});

			await usersClient.postApiUsersManageInfo(request);
			await fetchUser();

			Alert.alert("Success", "Profile updated successfully!");
			setIsEditing(false);
			setNewEmail("");
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		} catch (error: any) {
			console.error("Error updating profile:", error);
			Alert.alert("Error", "Failed to update profile. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleChangePassword = () => {
		setShowPasswordDialog(true);
		setNewEmail("");
		setCurrentPassword("");
		setNewPassword("");
		setConfirmPassword("");
	};

	const handleLogout = () => {
		setShowLogoutDialog(true);
	};

	const confirmLogout = async () => {
		setShowLogoutDialog(false);
		await logout();
	};

	// Load user preferences on component mount
	useEffect(() => {
		const loadPreferences = async () => {
			const userPrefs = await userPreferences.getPreferences();
			setPreferences(userPrefs);
		};
		loadPreferences();
	}, []);

	const updatePreference = async (key: keyof UserPreferences, value: any) => {
		const newPreferences = { ...preferences, [key]: value };
		setPreferences(newPreferences);
		await userPreferences.setPreferences({ [key]: value });
	};

	const handleSaveDemographics = async () => {
		if (!tempAge.trim()) {
			Alert.alert("Error", "Please enter your age");
			return;
		}

		const ageNum = parseInt(tempAge);
		if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
			Alert.alert("Error", "Please enter a valid age between 18 and 100");
			return;
		}

		if (!tempGender) {
			Alert.alert("Error", "Please select your gender");
			return;
		}

		setIsLoading(true);
		try {
			await userPreferences.setPreferences({
				age: ageNum,
				gender: tempGender as "male" | "female" | "other" | "prefer_not_to_say",
			});

			// Update local preferences state
			setPreferences((prev) => ({
				...prev,
				age: ageNum,
				gender: tempGender as "male" | "female" | "other" | "prefer_not_to_say",
			}));

			Alert.alert("Success", "Demographics updated successfully!");
			setIsEditingDemographics(false);
			setTempAge("");
			setTempGender("");
		} catch (error) {
			console.error("Error updating demographics:", error);
			Alert.alert("Error", "Failed to update demographics. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	// Initialize temp values when editing starts
	useEffect(() => {
		if (isEditingDemographics) {
			setTempAge(preferences.age?.toString() || "");
			setTempGender(preferences.gender || "");
		}
	}, [isEditingDemographics, preferences.age, preferences.gender]);

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView>
				{/* Profile Header */}
				<View style={styles.headerContainer}>
					<Avatar.Text
						size={80}
						label={(user?.displayName || user?.name || "U")
							.substring(0, 2)
							.toUpperCase()}
						style={styles.avatar}
					/>
					<Text style={styles.nameText}>
						{user?.displayName || user?.name || "User"}
					</Text>
					{user?.tag && <Text style={styles.tagText}>#{user.tag}</Text>}
					{user?.email && <Text style={styles.emailText}>{user.email}</Text>}
				</View>

				{/* Profile Information */}
				<Card style={styles.card}>
					<Card.Title
						title="Profile Information"
						right={() => (
							<Button
								mode="text"
								onPress={() => setIsEditing(!isEditing)}
								disabled={isLoading}
							>
								{isEditing ? "Cancel" : "Edit"}
							</Button>
						)}
					/>
					<Card.Content>
						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>User ID:</Text>
							<Text style={styles.infoValue}>
								{user?.id || "Not available"}
							</Text>
						</View>

						<Divider style={styles.divider} />

						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>Display Name:</Text>
							<Text style={styles.infoValue}>
								{user?.displayName || "Not set"}
							</Text>
						</View>

						<Divider style={styles.divider} />

						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>Name:</Text>
							<Text style={styles.infoValue}>
								{user?.name || "Not available"}
							</Text>
						</View>

						<Divider style={styles.divider} />

						<View style={styles.infoRow}>
							<Text style={styles.infoLabel}>Email:</Text>
							<Text style={styles.infoValue}>
								{user?.email || "Not available"}
							</Text>
						</View>

						{isEditing && (
							<>
								<Divider style={styles.divider} />
								<Text style={styles.sectionTitle}>Update Information</Text>

								<TextInput
									label="New Email (optional)"
									value={newEmail}
									onChangeText={setNewEmail}
									mode="outlined"
									style={styles.input}
									keyboardType="email-address"
									autoCapitalize="none"
								/>

								<TextInput
									label="Current Password"
									value={currentPassword}
									onChangeText={setCurrentPassword}
									mode="outlined"
									style={styles.input}
									secureTextEntry
									placeholder="Required for changes"
								/>

								<View style={styles.buttonRow}>
									<Button
										mode="contained"
										onPress={handleSaveProfile}
										disabled={isLoading}
										style={styles.saveButton}
									>
										{isLoading ? (
											<ActivityIndicator size="small" color="#fff" />
										) : (
											"Save Changes"
										)}
									</Button>
								</View>
							</>
						)}
					</Card.Content>
				</Card>

				{/* Account Settings */}
				<Card style={styles.card}>
					<Card.Title title="Account Settings" />
					<Card.Content>
						<List.Item
							title="Change Password"
							description="Update your account password"
							left={(props) => <List.Icon {...props} icon="lock" />}
							right={(props) => <List.Icon {...props} icon="chevron-right" />}
							onPress={handleChangePassword}
						/>
					</Card.Content>
				</Card>

				{/* App Settings */}
				<Card style={styles.card}>
					<Card.Title title="App Settings" />
					<Card.Content>
						<View style={styles.settingRow}>
							<View style={styles.settingInfo}>
								<Text style={styles.settingTitle}>Push Notifications</Text>
								<Text style={styles.settingDescription}>
									Receive notifications for new messages
								</Text>
							</View>
							<Switch
								value={preferences.notificationsEnabled}
								onValueChange={(value) =>
									updatePreference("notificationsEnabled", value)
								}
							/>
						</View>
						<Divider style={styles.divider} />
						<View style={styles.settingRow}>
							<View style={styles.settingInfo}>
								<Text style={styles.settingTitle}>Sound Effects</Text>
								<Text style={styles.settingDescription}>
									Play sounds for app interactions
								</Text>
							</View>
							<Switch
								value={preferences.soundEnabled}
								onValueChange={(value) =>
									updatePreference("soundEnabled", value)
								}
							/>
						</View>
					</Card.Content>
				</Card>

				{/* Demographics */}
				<Card style={styles.card}>
					<Card.Title
						title="Demographics"
						right={() => (
							<Button
								mode="text"
								onPress={() => setIsEditingDemographics(!isEditingDemographics)}
								disabled={isLoading}
							>
								{isEditingDemographics ? "Cancel" : "Edit"}
							</Button>
						)}
					/>
					<Card.Content>
						{!isEditingDemographics ? (
							<>
								<View style={styles.infoRow}>
									<Text style={styles.infoLabel}>Age:</Text>
									<Text style={styles.infoValue}>
										{preferences.age
											? `${preferences.age} years old`
											: "Not set"}
									</Text>
								</View>
								<Divider style={styles.divider} />
								<View style={styles.infoRow}>
									<Text style={styles.infoLabel}>Gender:</Text>
									<Text style={styles.infoValue}>
										{preferences.gender
											? preferences.gender
													.replace("_", " ")
													.replace(/\b\w/g, (l) => l.toUpperCase())
											: "Not set"}
									</Text>
								</View>
							</>
						) : (
							<>
								<Text style={styles.sectionTitle}>Update Demographics</Text>
								<TextInput
									label="Age"
									value={tempAge}
									onChangeText={setTempAge}
									mode="outlined"
									style={styles.input}
									keyboardType="numeric"
									maxLength={3}
								/>
								<Text style={styles.sectionTitle}>Gender</Text>
								<RadioButton.Group
									onValueChange={setTempGender}
									value={tempGender}
								>
									<View style={styles.radioOption}>
										<RadioButton value="male" />
										<Text style={styles.radioLabel}>Male</Text>
									</View>
									<View style={styles.radioOption}>
										<RadioButton value="female" />
										<Text style={styles.radioLabel}>Female</Text>
									</View>
									<View style={styles.radioOption}>
										<RadioButton value="other" />
										<Text style={styles.radioLabel}>Other</Text>
									</View>
									<View style={styles.radioOption}>
										<RadioButton value="prefer_not_to_say" />
										<Text style={styles.radioLabel}>Prefer not to say</Text>
									</View>
								</RadioButton.Group>
								<View style={styles.buttonRow}>
									<Button
										mode="contained"
										onPress={handleSaveDemographics}
										disabled={isLoading}
										style={styles.saveButton}
									>
										{isLoading ? (
											<ActivityIndicator size="small" color="#fff" />
										) : (
											"Save Changes"
										)}
									</Button>
								</View>
							</>
						)}
					</Card.Content>
				</Card>

				{/* Search Preferences */}
				<Card style={styles.card}>
					<Card.Title title="Chat Partner Preferences" />
					<Card.Content>
						<Text style={styles.settingDescription}>
							Search filters will be available soon! Your age and gender
							information helps the system match you with compatible chat
							partners.
						</Text>
						{(!preferences.age || !preferences.gender) && (
							<Text style={styles.warningText}>
								⚠️ Complete your demographics above to enable better matching
							</Text>
						)}
					</Card.Content>
				</Card>

				<View style={styles.buttonContainer}>
					<Button mode="contained" onPress={logout} style={styles.button}>
						Logout
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
	headerContainer: {
		alignItems: "center",
		padding: 20,
		backgroundColor: "#6200ee",
	},
	avatar: {
		backgroundColor: "#3700b3",
		marginBottom: 10,
	},
	nameText: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#fff",
		marginBottom: 5,
	},
	tagText: {
		fontSize: 16,
		color: "#e1e1e1",
		marginBottom: 5,
	},
	emailText: {
		fontSize: 16,
		color: "#e1e1e1",
	},
	card: {
		margin: 16,
	},
	dangerCard: {
		borderColor: "#ffcdd2",
		borderWidth: 1,
	},
	dangerTitle: {
		color: "#d32f2f",
	},
	infoRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: 8,
	},
	infoLabel: {
		fontWeight: "bold",
		fontSize: 16,
		color: "#555",
	},
	infoValue: {
		fontSize: 16,
		color: "#333",
		flex: 1,
		textAlign: "right",
	},
	divider: {
		marginVertical: 4,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#333",
		marginTop: 16,
		marginBottom: 8,
	},
	input: {
		marginVertical: 8,
	},
	dialogInput: {
		marginVertical: 4,
	},
	buttonRow: {
		flexDirection: "row",
		justifyContent: "flex-end",
		marginTop: 16,
	},
	saveButton: {
		minWidth: 120,
	},
	settingRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 8,
	},
	settingInfo: {
		flex: 1,
	},
	settingTitle: {
		fontSize: 16,
		fontWeight: "500",
		color: "#333",
	},
	settingDescription: {
		fontSize: 14,
		color: "#666",
		marginTop: 2,
	},
	logoutButton: {
		borderColor: "#d32f2f",
	},
	buttonContainer: {
		padding: 16,
	},
	button: {
		marginVertical: 10,
	},
	warningText: {
		color: "#ff9800",
		fontSize: 14,
		marginTop: 8,
		fontWeight: "500",
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
});

export default ProfileScreen;
