import {
	HubConnection,
	HubConnectionBuilder,
	LogLevel,
} from "@microsoft/signalr";
import authStorage from "../utils/authStorage";
import config from "../config";
import { ChatMessageDto } from "../api/client";

export interface SearchFilters {
	ageRangeEnabled: boolean;
	minAge: number;
	maxAge: number;
	genderPreferences: string[];
	sameAgeGroupOnly: boolean;
}

type MessageHandler = (message: ChatMessageDto) => void;
type UserConnectionHandler = (userId: string, username: string) => void;
type UserDisconnectionHandler = (userId: string) => void;
type ActiveUsersHandler = (users: string[]) => void;
type MessageStatusHandler = (timestampId: string, userId: string) => void;
type MessageUpdateHandler = (message: ChatMessageDto) => void;

class SignalRService {
        private connection: HubConnection | null = null;
        private connectionPromise: Promise<HubConnection> | null = null;
        private messageHandlers: MessageHandler[] = [];
        private userConnectedHandlers: UserConnectionHandler[] = [];
        private userDisconnectedHandlers: UserDisconnectionHandler[] = [];
        private activeUsersHandlers: ActiveUsersHandler[] = [];
        private privateMessageHandlers: MessageHandler[] = [];
        private messageReceivedStatusHandlers: MessageStatusHandler[] = [];
        private messageReadStatusHandlers: MessageStatusHandler[] = [];
        private messageReceivedUpdateHandlers: MessageUpdateHandler[] = [];
        private messageReadUpdateHandlers: MessageUpdateHandler[] = [];

	async startConnection(): Promise<HubConnection> {
		if (this.connection && this.connection.state === "Connected") {
			return this.connection;
		}

		if (this.connectionPromise) {
			return this.connectionPromise;
		}

		this.connectionPromise = new Promise<HubConnection>(
			async (resolve, reject) => {
				try {
					console.log("Establishing SignalR connection...");

					this.connection = new HubConnectionBuilder()
						.withUrl(config.signalRUrl, {
							withCredentials: true
						})
						.configureLogging(LogLevel.Information)
						.withAutomaticReconnect()
						.build();

					// Set up event handlers
					this.connection.on("ReceiveMessage", (message: ChatMessageDto) => {
						this.messageHandlers.forEach((handler) => handler(message));
					});

					this.connection.on(
						"UserConnected",
						(userId: string, username: string) => {
							this.userConnectedHandlers.forEach((handler) =>
								handler(userId, username),
							);
						},
					);

					this.connection.on("UserDisconnected", (userId: string) => {
						this.userDisconnectedHandlers.forEach((handler) => handler(userId));
					});

					this.connection.on("ActiveUsers", (users: string[]) => {
						this.activeUsersHandlers.forEach((handler) => handler(users));
					});

					this.connection.on(
						"ReceivePrivateMessage",
						(message: ChatMessageDto) => {
							this.privateMessageHandlers.forEach((handler) =>
								handler(message),
							);
						},
					);

					this.connection.on(
						"MessageReceived",
						(message: ChatMessageDto) => {
							console.log(`SignalR: Received MessageReceived event - message:`, message);
							// Call both old handlers (for backward compatibility) and new handlers
							this.messageReceivedStatusHandlers.forEach((handler) =>
								handler(message.guid, message.senderId),
							);
							this.messageReceivedUpdateHandlers.forEach((handler) =>
								handler(message),
							);
						},
					);

					this.connection.on(
						"MessageRead",
						(message: ChatMessageDto) => {
							console.log(`SignalR: Received MessageRead event - message:`, message);
							// Call both old handlers (for backward compatibility) and new handlers
							this.messageReadStatusHandlers.forEach((handler) =>
								handler(message.guid, message.senderId),
							);
							this.messageReadUpdateHandlers.forEach((handler) =>
								handler(message),
							);
						},
					);

					await this.connection.start();
					console.log("SignalR connection established");
					resolve(this.connection);
				} catch (error) {
					console.error("Error establishing SignalR connection:", error);
					this.connectionPromise = null;
					reject(error);
				}
			},
		);

		return this.connectionPromise;
	}

	async stopConnection(): Promise<void> {
		if (this.connection) {
			await this.connection.stop();
			this.connection = null;
			this.connectionPromise = null;
			console.log("SignalR connection stopped");
		}
	}

        async sendMessage(chatMessage: ChatMessageDto): Promise<void> {
                if (!chatMessage.body || !chatMessage.body.trim()) return;

		try {
			const connection = await this.startConnection();
			await connection.invoke("SendMessage", chatMessage);
		} catch (error) {
			console.error("Error sending message:", error);
			throw error;
                }
        }

        async markMessageReceived(chatId: number, timeStampId: string): Promise<void> {
                try {
                        const connection = await this.startConnection();
                        await connection.invoke("MarkMessageReceived", chatId, timeStampId);
                } catch (error) {
                        console.error("Error marking message received:", error);
                }
        }

        async markMessageRead(chatId: number, timeStampId: string): Promise<void> {
                try {
                        const connection = await this.startConnection();
                        await connection.invoke("MarkMessageRead", chatId, timeStampId);
                } catch (error) {
                        console.error("Error marking message read:", error);
                }
        }

	async joinChat(chatId: number): Promise<void> {
		if (!chatId) return;

		try {
			const connection = await this.startConnection();
			await connection.invoke("JoinChat", chatId);
			console.log(`Joined chat: ${chatId}`);
		} catch (error) {
			console.error(`Error joining chat ${chatId}:`, error);
			throw error;
		}
	}

	async leaveChat(chatId: number): Promise<void> {
		if (!chatId) return;

		try {
			const connection = await this.startConnection();
			await connection.invoke("LeaveChat", chatId);
			console.log(`Left chat: ${chatId}`);
		} catch (error) {
			console.error(`Error leaving chat ${chatId}:`, error);
			throw error;
		}
	}

	async findRandomChat(): Promise<number> {
		try {
			const connection = await this.startConnection();
			const chatId = await connection.invoke<number>("FindRandomChat");
			console.log(`Found random chat: ${chatId}`);
			return chatId;
		} catch (error) {
			console.error("Error finding random chat:", error);
			throw error;
		}
	}

	async findRandomChatWithFilters(filters: SearchFilters): Promise<number> {
		try {
			const connection = await this.startConnection();
			const chatId = await connection.invoke<number>("FindRandomChatWithFilters", filters);
			console.log(`Found filtered random chat: ${chatId}`);
			return chatId;
		} catch (error) {
			console.error("Error finding filtered random chat:", error);
			throw error;
		}
	}

	// Event handling methods
	onMessageReceived(handler: MessageHandler): () => void {
		this.messageHandlers.push(handler);
		return () => {
			this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
		};
	}

	onUserConnected(handler: UserConnectionHandler): () => void {
		this.userConnectedHandlers.push(handler);
		return () => {
			this.userConnectedHandlers = this.userConnectedHandlers.filter(
				(h) => h !== handler,
			);
		};
	}

	onUserDisconnected(handler: UserDisconnectionHandler): () => void {
		this.userDisconnectedHandlers.push(handler);
		return () => {
			this.userDisconnectedHandlers = this.userDisconnectedHandlers.filter(
				(h) => h !== handler,
			);
		};
	}

	onActiveUsers(handler: ActiveUsersHandler): () => void {
		this.activeUsersHandlers.push(handler);
		return () => {
			this.activeUsersHandlers = this.activeUsersHandlers.filter(
				(h) => h !== handler,
			);
		};
	}

	onPrivateMessageReceived(handler: MessageHandler): () => void {
			this.privateMessageHandlers.push(handler);
			return () => {
				this.privateMessageHandlers = this.privateMessageHandlers.filter(
						(h) => h !== handler,
				);
		};
	}

	onMessageReceivedStatus(handler: MessageStatusHandler): () => void {
			this.messageReceivedStatusHandlers.push(handler);
			return () => {
					this.messageReceivedStatusHandlers = this.messageReceivedStatusHandlers.filter(
							(h) => h !== handler,
					);
			};
	}

	onMessageReadStatus(handler: MessageStatusHandler): () => void {
			this.messageReadStatusHandlers.push(handler);
			return () => {
					this.messageReadStatusHandlers = this.messageReadStatusHandlers.filter(
							(h) => h !== handler,
					);
			};
	}

	onMessageReceivedUpdate(handler: MessageUpdateHandler): () => void {
			this.messageReceivedUpdateHandlers.push(handler);
			return () => {
					this.messageReceivedUpdateHandlers = this.messageReceivedUpdateHandlers.filter(
							(h) => h !== handler,
					);
			};
	}

	onMessageReadUpdate(handler: MessageUpdateHandler): () => void {
			this.messageReadUpdateHandlers.push(handler);
			return () => {
					this.messageReadUpdateHandlers = this.messageReadUpdateHandlers.filter(
							(h) => h !== handler,
					);
			};
	}
}

export default new SignalRService();
