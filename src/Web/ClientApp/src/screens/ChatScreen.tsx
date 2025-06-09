import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
	FlatList,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	View,
} from "react-native";
import { ActivityIndicator, Button, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MainTabParamList } from "../navigation/AppNavigator";
import signalRService from "../services/signalRService";
import ChatBubble from "../components/ChatBubble";
import { useAuth } from "../contexts/AuthContext";
import { ChatMessageDto, MessageState } from "../api/client";
import { chatsClient } from "../api";
import { DateTime } from "luxon";
import { v4 } from "uuid";

type ChatConversationScreenProps = NativeStackScreenProps<
	MainTabParamList,
	"ChatConversation"
>;

const ChatScreen = ({ route, navigation }: ChatConversationScreenProps) => {
	const { chatId } = route.params;
	const { user } = useAuth();
	const [messages, setMessages] = useState<ChatMessageDto[]>([]);
	const [newMessage, setNewMessage] = useState("");
	const [isConnecting, setIsConnecting] = useState(true);
	const [isLoadingHistory, setIsLoadingHistory] = useState(false);
	const [chatHistoryPageNumber, setChatHistoryPageNumber] = useState(1);
	const [hasMoreHistory, setHasMoreHistory] = useState(true);
	const chatHistoryPageSize = 20;
	const [error, setError] = useState<string | null>(null);
	const flatListRef = useRef<FlatList>(null);
	const messageInputRef = useRef<any>(null);

	// Set the header title
	useLayoutEffect(() => {
		navigation.setOptions({
			title: chatId.toString(),
		});
	}, [navigation, chatId]);

	useEffect(() => {
		let unsubscribeMessageHandler: (() => void) | null = null;
		let unsubscribeReceived: (() => void) | null = null;
		let unsubscribeRead: (() => void) | null = null;

		const loadChatHistory = async (isInitialLoad = false) => {
			if (!hasMoreHistory || isLoadingHistory) return;

			setIsLoadingHistory(true);
			setError(null);
			try {
				const response = await chatsClient.getChatMessages(
					chatId,
					chatHistoryPageNumber,
					chatHistoryPageSize,
				);

				if (response.items) {
					console.log(
						"Loading chat history:",
						response.items.length,
						"messages",
					);
					console.log(
						"Chat history GUIDs:",
						response.items.map(
							(m) => `${m.id}:${m.guid}:${m.body?.substring(0, 20)}`,
						),
					);
					setMessages((prevMessages) => [...response.items!, ...prevMessages]);
					response
						.items!.filter(
							(m) => m.state === MessageState.Sent && m.senderId !== user?.id,
						)
						.forEach((m) => {
							if (m.guid) {
								signalRService.markMessageReceived(m.chatId, m.guid);
								signalRService.markMessageRead(m.chatId, m.guid);
							}
						});
					setHasMoreHistory(response.hasNextPage ?? false);
					setChatHistoryPageNumber((prevPageNumber) => prevPageNumber + 1);
				} else {
					setHasMoreHistory(false);
				}

				if (isInitialLoad) {
					setTimeout(() => {
						flatListRef.current?.scrollToEnd({ animated: false });
					}, 100);
				}
			} catch (err) {
				console.error("Error loading chat history:", err);
				setError("Failed to load chat history.");
			} finally {
				setIsLoadingHistory(false);
			}
		};

		const connectToChat = async () => {
			setIsConnecting(true);
			setError(null);

			try {
				await signalRService.startConnection();

				// Set up event handlers BEFORE joining the chat to avoid race conditions
				unsubscribeMessageHandler = signalRService.onMessageReceived(
					(message) => {
						if (message.chatId === chatId) {
							console.log("Received message from SignalR:", message);
							console.log("Message GUID from SignalR:", message.guid);
							const processedMessage = ChatMessageDto.fromJS(message);
							console.log("Processed message GUID:", processedMessage.guid);
							setMessages((prevMessages) => [
								...prevMessages,
								processedMessage,
							]);
							if (
								user &&
								processedMessage.senderId !== user.id &&
								processedMessage.guid
							) {
								console.log(
									`Marking message ${processedMessage.id} (${processedMessage.guid}) as received and read`,
								);
								signalRService.markMessageReceived(
									processedMessage.chatId,
									processedMessage.guid,
								);
								signalRService.markMessageRead(
									processedMessage.chatId,
									processedMessage.guid,
								);
							}
							setTimeout(() => {
								flatListRef.current?.scrollToEnd({ animated: true });
							}, 100);
						}
					},
				);

				unsubscribeReceived = signalRService.onMessageReceivedUpdate(
					(updatedMessage) => {
						console.log(
							`Message ${updatedMessage.guid} marked as received by user ${updatedMessage.senderId}`,
						);
						setMessages((prev) => {
							const updated = prev.map((m) => {
								if (m.guid === updatedMessage.guid) {
									console.log(
										`Found matching message to update: ${m.id}, current state: ${m.state} -> ${updatedMessage.state}`,
									);
									return {
										...m,
										state: updatedMessage.state,
									} as ChatMessageDto;
								}
								return m;
							});

							const foundMatch = updated.some(
								(m, i) => m.state !== prev[i].state,
							);
							console.log("Did any message state change?", foundMatch);

							return updated;
						});
					},
				);

				unsubscribeRead = signalRService.onMessageReadUpdate(
					(updatedMessage) => {
						console.log(
							`Message ${updatedMessage.guid} marked as read by user ${updatedMessage.senderId}`,
						);
						setMessages((prev) => {
							const updated = prev.map((m) => {
								if (m.guid === updatedMessage.guid) {
									console.log(
										`Found matching message to update: ${m.id}, current state: ${m.state} -> ${updatedMessage.state}`,
									);
									return {
										...m,
										state: updatedMessage.state,
									} as ChatMessageDto;
								}
								return m;
							});
							console.log(
								"Messages after read update:",
								updated.map((m) => ({
									id: m.id,
									guid: m.guid,
									state: m.state,
								})),
							);
							return updated;
						});
					},
				);

				await signalRService.joinChat(chatId);
				await loadChatHistory(true);

				setIsConnecting(false);
			} catch (err) {
				setError("Failed to connect to chat. Please try again later.");
				setIsConnecting(false);
				console.error(
					"Error connecting to SignalR hub or loading history:",
					err,
				);
			}
		};

		// Only connect if user is available
		if (user) {
			connectToChat();
		}

		// Cleanup on unmount
		return () => {
			if (unsubscribeMessageHandler) {
				unsubscribeMessageHandler();
			}
			if (unsubscribeReceived) {
				unsubscribeReceived();
			}
			if (unsubscribeRead) {
				unsubscribeRead();
			}
			signalRService.leaveChat(chatId).catch((err) => {
				console.error(`Error leaving chat ${chatId}:`, err);
			});
		};
	}, [chatId, user]);

	const sendMessage = async () => {
		if (!newMessage.trim() || !user) return;

		const guid = v4();
		const newMsg: Partial<ChatMessageDto> = {
			id: Date.now(),
			chatId: chatId,
			senderId: user.id!,
			body: newMessage,
			state: MessageState.Sent,
			timeStamp: DateTime.now(),
			guid: guid,
		};

		console.log("Sending message with GUID:", guid);

		// Add message immediately (optimistic update)
		setMessages((prev) => [...prev, newMsg as ChatMessageDto]);
		setNewMessage("");
		messageInputRef.current?.focus();

		setTimeout(() => {
			flatListRef.current?.scrollToEnd({ animated: true });
		}, 100);

		// Send to backend asynchronously without waiting
		try {
			await signalRService.sendMessage({ ...newMsg, id: 0 } as ChatMessageDto);
		} catch (err) {
			console.error("Error sending message:", err);
			setError("Failed to send message. Please try again.");
			// Optionally remove the message from local state if send failed
			setMessages((prev) => prev.filter((m) => m.guid !== guid));
		}
	};

	if (isConnecting) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#6200ee" />
				<Text style={styles.loadingText}>Connecting to chat...</Text>
			</View>
		);
	}

	return (
		<SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
			{error && (
				<View style={styles.errorContainer}>
					<Text style={styles.errorText}>{error}</Text>
				</View>
			)}

			{isLoadingHistory && messages.length > 0 && (
				<View style={styles.historyLoadingContainer}>
					<ActivityIndicator size="small" color="#6200ee" />
				</View>
			)}

			<FlatList
				ref={flatListRef}
				data={messages}
				keyExtractor={(item, index) =>
					item.guid || `temp-${index}-${item.id || Date.now()}`
				}
				renderItem={({ item }) => (
					<ChatBubble
						message={item}
						isOwnMessage={item.senderId === user?.id}
					/>
				)}
				contentContainerStyle={styles.messagesContainer}
			/>

			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
			>
				<View style={styles.inputContainer}>
					<TextInput
						ref={messageInputRef}
						style={styles.input}
						placeholder="Type a message..."
						value={newMessage}
						onChangeText={setNewMessage}
						mode="outlined"
						returnKeyType="send"
						onSubmitEditing={sendMessage}
					/>
					<Button
						mode="contained"
						onPress={sendMessage}
						style={styles.sendButton}
					>
						Send
					</Button>
				</View>
			</KeyboardAvoidingView>
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
	errorContainer: {
		padding: 10,
		backgroundColor: "#ffebee",
		borderRadius: 5,
		margin: 10,
	},
	errorText: {
		color: "#d32f2f",
		fontSize: 14,
	},
	historyLoadingContainer: {
		padding: 10,
		alignItems: "center",
	},
	messagesContainer: {
		padding: 10,
		paddingBottom: 20,
	},
	inputContainer: {
		flexDirection: "row",
		padding: 10,
		backgroundColor: "#fff",
		borderTopWidth: 1,
		borderTopColor: "#e0e0e0",
	},
	input: {
		flex: 1,
		marginRight: 10,
		backgroundColor: "#fff",
	},
	sendButton: {
		justifyContent: "center",
	},
});

export default ChatScreen;
