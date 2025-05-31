import * as SecureStore from 'expo-secure-store';

export interface UserPreferences {
	notificationsEnabled: boolean;
	soundEnabled: boolean;
	theme: 'light' | 'dark' | 'system';
	age?: number;
	gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
	searchFilters?: {
		ageRangeEnabled: boolean;
		minAge: number;
		maxAge: number;
		genderPreferences: string[];
		sameAgeGroupOnly: boolean;
	};
}

const PREFERENCES_KEY = 'user_preferences';

const defaultPreferences: UserPreferences = {
	notificationsEnabled: true,
	soundEnabled: true,
	theme: 'system',
};

export const userPreferences = {
	async getPreferences(): Promise<UserPreferences> {
		try {
			const stored = await SecureStore.getItemAsync(PREFERENCES_KEY);
			if (stored) {
				return { ...defaultPreferences, ...JSON.parse(stored) };
			}
			return defaultPreferences;
		} catch (error) {
			console.error('Error loading user preferences:', error);
			return defaultPreferences;
		}
	},

	async setPreferences(preferences: Partial<UserPreferences>): Promise<void> {
		try {
			const current = await this.getPreferences();
			const updated = { ...current, ...preferences };
			await SecureStore.setItemAsync(PREFERENCES_KEY, JSON.stringify(updated));
		} catch (error) {
			console.error('Error saving user preferences:', error);
		}
	},

	async clearPreferences(): Promise<void> {
		try {
			await SecureStore.deleteItemAsync(PREFERENCES_KEY);
		} catch (error) {
			console.error('Error clearing user preferences:', error);
		}
	},
};

export default userPreferences; 