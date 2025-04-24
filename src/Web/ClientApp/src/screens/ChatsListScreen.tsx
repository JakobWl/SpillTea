import React, { useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import {
	ActivityIndicator,
	Avatar,
	Divider,
	FAB,
	Snackbar,
	Text,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainTabParamList } from "../navigation/AppNavigator";
import signalRService from "../services/signalRService";
import { useQuery } from "@tanstack/react-query";
import { ChatDto } from "../api/client";
import { chatsClient } from "../api";

type ChatsListNavigationProp = NativeStackNavigationProp<
	MainTabParamList,
	"ChatsList"
>;

const ChatsListScreen = () => {
	const navigation = useNavigation<ChatsListNavigationProp>();
	const [chats, setChats] = useState<ChatDto[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isFindingChat, setIsFindingChat] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const getChats = async () => {
		try {
			setIsLoading(true);
			const response = await chatsClient.getChats();
			setChats(response.items ?? []);
		} catch (error) {
			console.error("Error fetching chats:", error);
			setError("Failed to fetch chats. Please try again later.");
		} finally {
			setIsLoading(false);
		}
	};

	useQuery({ queryKey: ["chats"], queryFn: getChats });

	const formatTimestamp = (isoString: string) => {
		const date = new Date(isoString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays === 0) {
			// Today - show time
			return date.toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
			});
		} else if (diffDays === 1) {
			// Yesterday
			return "Yesterday";
		} else if (diffDays < 7) {
			// Within a week - show day name
			return date.toLocaleDateString([], { weekday: "short" });
		} else {
			// Older - show date
			return date.toLocaleDateString([], { month: "short", day: "numeric" });
		}
	};

	const handleChatPress = (chatId: number) => {
		navigation.navigate("ChatConversation", {
			chatId: chatId,
		});
	};

	const handleFindRandomChat = async () => {
		setIsFindingChat(true);
		setError(null);

		try {
			// Connect to SignalR if not already connected
			await signalRService.startConnection();

			// Find a random chat partner
			const chatId = await signalRService.findRandomChat();

			// Navigate to the chat conversation
			navigation.navigate("ChatConversation", {
				chatId: chatId,
			});
		} catch (err) {
			console.error("Error finding random chat:", err);
			setError("Failed to find random chat. Please try again later.");
		} finally {
			setIsFindingChat(false);
		}
	};

	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#6200ee" />
				<Text style={styles.loadingText}>Loading chats...</Text>
			</View>
		);
	}

	return (
		<SafeAreaView style={styles.container}>
			<FlatList
				data={chats}
				keyExtractor={(item) => item.id.toString()}
				renderItem={({ item }) => (
					<TouchableOpacity
						style={styles.chatItem}
						onPress={() => handleChatPress(item.id)}
					>
						<Avatar.Image
							source={{ uri: "https://via.placeholder.com/50" }}
							size={50}
							style={styles.avatar}
						/>
						<View style={styles.chatInfo}>
							<View style={styles.chatHeader}>
								<Text style={styles.chatName}>Test</Text>
								<Text style={styles.timestamp}>
									{formatTimestamp(item.lastModified.toString())}
								</Text>
							</View>
							<View style={styles.chatFooter}>
								<Text
									style={styles.lastMessage}
									numberOfLines={1}
									ellipsizeMode="tail"
								>
									{item.lastMessage ?? "No messages yet"}
								</Text>
								{item.unreadCount > 0 && (
									<View style={styles.unreadBadge}>
										<Text style={styles.unreadCount}>{item.unreadCount}</Text>
									</View>
								)}
							</View>
						</View>
					</TouchableOpacity>
				)}
				ItemSeparatorComponent={() => <Divider />}
				contentContainerStyle={styles.listContent}
			/>

			<FAB
				style={styles.fab}
				icon="account-search"
				label="Find Random Chat"
				onPress={handleFindRandomChat}
				loading={isFindingChat}
				disabled={isFindingChat}
			/>

			<Snackbar
				visible={!!error}
				onDismiss={() => setError(null)}
				action={{
					label: "Dismiss",
					onPress: () => setError(null),
				}}
			>
				{error}
			</Snackbar>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f5f5f5",
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	loadingText: {
		marginTop: 10,
		fontSize: 16,
		color: "#444",
	},
	listContent: {
		paddingBottom: 80, // Add space for FAB
	},
	chatItem: {
		flexDirection: "row",
		padding: 16,
		backgroundColor: "#fff",
	},
	avatar: {
		marginRight: 16,
		backgroundColor: "#e0e0e0",
	},
	chatInfo: {
		flex: 1,
		justifyContent: "center",
	},
	chatHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 4,
	},
	chatName: {
		fontSize: 16,
		fontWeight: "bold",
	},
	timestamp: {
		fontSize: 12,
		color: "#757575",
	},
	chatFooter: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	lastMessage: {
		fontSize: 14,
		color: "#757575",
		flex: 1,
		marginRight: 8,
	},
	unreadBadge: {
		backgroundColor: "#6200ee",
		borderRadius: 12,
		height: 24,
		minWidth: 24,
		justifyContent: "center",
		alignItems: "center",
		padding: 2,
	},
	unreadCount: {
		color: "#fff",
		fontSize: 12,
		fontWeight: "bold",
	},
	fab: {
		position: "absolute",
		margin: 16,
		right: 0,
		bottom: 0,
		backgroundColor: "#6200ee",
	},
});

export default ChatsListScreen;
