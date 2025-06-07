import React, { useState, useEffect } from "react";
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
import { ChatDto, ChatMessageDto } from "../api/client";
import { chatsClient, usersClient } from "../api";
import { formatTimestamp } from "../utils/dateTime";
import { DateTime } from "luxon";

type ChatsListNavigationProp = NativeStackNavigationProp<
	MainTabParamList,
	"ChatsList"
>;

// Define UserAvatar component
const UserAvatar: React.FC<{
	userId: string | null | undefined;
	size: number;
	style?: any;
}> = ({ userId, size, style }) => {
	const [avatarUrl, setAvatarUrl] = useState<string | null>(null); // Initialize with null

	useEffect(() => {
		if (userId) {
			let isMounted = true;
			usersClient
				.getUserImage(userId)
				.then((url) => {
					if (isMounted && url) {
						setAvatarUrl(url as string);
					} else if (isMounted) {
						setAvatarUrl(null); // Fallback to null if API returns no valid URL
					}
				})
				.catch((error) => {
					console.error(`Failed to fetch avatar for user ${userId}:`, error);
					if (isMounted) {
						setAvatarUrl(null); // Fallback to null on error
					}
				});
			return () => {
				isMounted = false;
			};
		} else {
			setAvatarUrl(null); // No userId, set to null
		}
	}, [userId]);

	return (
		<Avatar.Image
			source={{ uri: avatarUrl as string | undefined }}
			size={size}
			style={style}
		/>
	);
};

const convertToDateTime = (dateField: Date | string | undefined): DateTime => {
	if (!dateField) return DateTime.fromMillis(0);
	if (typeof dateField === "string") return DateTime.fromISO(dateField);
	// Assuming dateField is a Date object if not string and not undefined
	return DateTime.fromJSDate(dateField as Date);
};

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
			const sortedChats = (response.items ?? []).sort((a, b) => {
				const dateA = convertToDateTime(a.lastModified as any);
				const dateB = convertToDateTime(b.lastModified as any);
				if (!dateA.isValid && !dateB.isValid) return 0;
				if (!dateA.isValid) return 1;
				if (!dateB.isValid) return -1;
				return dateB.toMillis() - dateA.toMillis();
			});
			setChats(sortedChats);
		} catch (error) {
			console.error("Error fetching chats:", error);
			setError("Failed to fetch chats. Please try again later.");
		} finally {
			setIsLoading(false);
		}
	};

	useQuery({ queryKey: ["chats"], queryFn: getChats });

	useEffect(() => {
		const connectAndSubscribe = async () => {
			try {
				await signalRService.startConnection();
				console.log("SignalR connection established for ChatsListScreen.");
			} catch (err) {
				console.error(
					"Failed to start SignalR connection for ChatsListScreen:",
					err,
				);
				// Optionally set an error state here if connection is critical for this screen's core functionality
			}
		};

		connectAndSubscribe();

                const handleNewMessage = (message: ChatMessageDto) => {
                        console.log("New message received in ChatsListScreen:", message);
                        if (message.senderId !== user?.id) {
                                signalRService.markMessageReceived(message.id);
                        }
                        setChats((prevChats) => {
                                let chatExists = false;
				const updatedChats = prevChats.map((chat) => {
					if (chat.id === message.chatId) {
						chatExists = true;
						const newLastModified =
							message.timeStamp && message.timeStamp.isValid
								? message.timeStamp
								: DateTime.now();

						return {
							...chat,
							lastMessage: message.body,
							lastModified: newLastModified,
							unreadCount: (chat.unreadCount ?? 0) + 1,
						} as ChatDto;
					}
					return chat;
				});

				if (!chatExists) {
					console.warn(
						"Message for new or unknown chat (" +
							message.chatId +
							") received. Consider fetching chat details.",
					);
					return prevChats;
				}

				return updatedChats.sort((a, b) => {
					const dateA = convertToDateTime(a.lastModified as any);
					const dateB = convertToDateTime(b.lastModified as any);
					if (!dateA.isValid && !dateB.isValid) return 0;
					if (!dateA.isValid) return 1;
					if (!dateB.isValid) return -1;
					return dateB.toMillis() - dateA.toMillis();
				});
			});
		};

		const unsubscribe = signalRService.onMessageReceived(handleNewMessage);

		// Cleanup on component unmount
		return () => {
			unsubscribe();
			// Optional: consider if signalRService.stopConnection() should be called here.
			// If other parts of the app use the connection, stopping it here might be premature.
			// Typically, stopConnection is called when the app closes or user logs out.
		};
	}, []); // Empty dependency array means this effect runs once on mount and cleanup on unmount

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

			// TODO: In the future, we can pass search filters to the backend
			// For now, we'll use the existing random chat functionality
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
						<UserAvatar
							userId={item.lastMessageSenderId}
							size={50}
							style={styles.avatar}
						/>
						<View style={styles.chatInfo}>
							<View style={styles.chatHeader}>
								<Text style={styles.chatName}>
									{(item as any).displayName || "Chat"}
								</Text>
								<Text style={styles.timestamp}>
									{formatTimestamp(item.lastModified)}
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
								{item.unreadCount != null && item.unreadCount > 0 && (
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

			<View style={styles.fabContainer}>
				<FAB
					style={styles.fabSecondary}
					icon="filter"
					onPress={() => navigation.navigate("SearchFilters" as any)}
					disabled={isFindingChat}
					size="small"
				/>
				<FAB
					style={styles.fab}
					icon="account-search"
					label="Find Random Chat"
					onPress={handleFindRandomChat}
					loading={isFindingChat}
					disabled={isFindingChat}
				/>
			</View>

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
	fabContainer: {
		position: "absolute",
		right: 16,
		bottom: 16,
		flexDirection: "column",
		alignItems: "flex-end",
	},
	fab: {
		backgroundColor: "#6200ee",
		marginBottom: 8,
	},
	fabSecondary: {
		backgroundColor: "#03dac6",
		marginBottom: 8,
	},
});

export default ChatsListScreen;
