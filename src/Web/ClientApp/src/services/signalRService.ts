import { HubConnectionBuilder, LogLevel, HubConnection } from '@microsoft/signalr';
import { ChatMessage } from '../types/chat';
import authStorage from '../utils/authStorage';
import config from '../config';

type MessageHandler = (message: ChatMessage) => void;
type UserConnectionHandler = (userId: string, username: string) => void;
type UserDisconnectionHandler = (userId: string) => void;
type ActiveUsersHandler = (users: string[]) => void;

class SignalRService {
  private connection: HubConnection | null = null;
  private connectionPromise: Promise<HubConnection> | null = null;
  private messageHandlers: MessageHandler[] = [];
  private userConnectedHandlers: UserConnectionHandler[] = [];
  private userDisconnectedHandlers: UserDisconnectionHandler[] = [];
  private activeUsersHandlers: ActiveUsersHandler[] = [];
  private privateMessageHandlers: MessageHandler[] = [];

  async startConnection(): Promise<HubConnection> {
    if (this.connection && this.connection.state === 'Connected') {
      return this.connection;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise<HubConnection>(async (resolve, reject) => {
      try {
        // Get the token from storage
        const token = await authStorage.getToken();

        this.connection = new HubConnectionBuilder()
          .withUrl(config.signalRUrl, {
            accessTokenFactory: () => token || '',
          })
          .configureLogging(LogLevel.Information)
          .withAutomaticReconnect()
          .build();

        // Set up event handlers
        this.connection.on('ReceiveMessage', (message: ChatMessage) => {
          this.messageHandlers.forEach(handler => handler(message));
        });

        this.connection.on('UserConnected', (userId: string, username: string) => {
          this.userConnectedHandlers.forEach(handler => handler(userId, username));
        });

        this.connection.on('UserDisconnected', (userId: string) => {
          this.userDisconnectedHandlers.forEach(handler => handler(userId));
        });

        this.connection.on('ActiveUsers', (users: string[]) => {
          this.activeUsersHandlers.forEach(handler => handler(users));
        });

        this.connection.on('ReceivePrivateMessage', (message: ChatMessage) => {
          this.privateMessageHandlers.forEach(handler => handler(message));
        });

        await this.connection.start();
        console.log('SignalR connection established');
        resolve(this.connection);
      } catch (error) {
        console.error('Error establishing SignalR connection:', error);
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  async stopConnection(): Promise<void> {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      this.connectionPromise = null;
      console.log('SignalR connection stopped');
    }
  }

  async sendMessage(chatId: string, message: string): Promise<void> {
    if (!chatId || !message || !message.trim()) return;
    
    try {
      const connection = await this.startConnection();
      await connection.invoke('SendMessage', chatId, message);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async sendPrivateMessage(recipientId: string, message: string): Promise<void> {
    if (!recipientId || !message || !message.trim()) return;
    
    try {
      const connection = await this.startConnection();
      await connection.invoke('SendPrivateMessage', recipientId, message);
    } catch (error) {
      console.error('Error sending private message:', error);
      throw error;
    }
  }
  
  async joinChat(chatId: string): Promise<void> {
    if (!chatId) return;
    
    try {
      const connection = await this.startConnection();
      await connection.invoke('JoinChat', chatId);
      console.log(`Joined chat: ${chatId}`);
    } catch (error) {
      console.error(`Error joining chat ${chatId}:`, error);
      throw error;
    }
  }
  
  async leaveChat(chatId: string): Promise<void> {
    if (!chatId) return;
    
    try {
      const connection = await this.startConnection();
      await connection.invoke('LeaveChat', chatId);
      console.log(`Left chat: ${chatId}`);
    } catch (error) {
      console.error(`Error leaving chat ${chatId}:`, error);
      throw error;
    }
  }
  
  async findRandomChat(): Promise<string> {
    try {
      const connection = await this.startConnection();
      const chatId = await connection.invoke<string>('FindRandomChat');
      console.log(`Found random chat: ${chatId}`);
      return chatId;
    } catch (error) {
      console.error('Error finding random chat:', error);
      throw error;
    }
  }

  // Event handling methods
  onMessageReceived(handler: MessageHandler): () => void {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  onUserConnected(handler: UserConnectionHandler): () => void {
    this.userConnectedHandlers.push(handler);
    return () => {
      this.userConnectedHandlers = this.userConnectedHandlers.filter(h => h !== handler);
    };
  }

  onUserDisconnected(handler: UserDisconnectionHandler): () => void {
    this.userDisconnectedHandlers.push(handler);
    return () => {
      this.userDisconnectedHandlers = this.userDisconnectedHandlers.filter(h => h !== handler);
    };
  }

  onActiveUsers(handler: ActiveUsersHandler): () => void {
    this.activeUsersHandlers.push(handler);
    return () => {
      this.activeUsersHandlers = this.activeUsersHandlers.filter(h => h !== handler);
    };
  }

  onPrivateMessageReceived(handler: MessageHandler): () => void {
    this.privateMessageHandlers.push(handler);
    return () => {
      this.privateMessageHandlers = this.privateMessageHandlers.filter(h => h !== handler);
    };
  }
}

export default new SignalRService();