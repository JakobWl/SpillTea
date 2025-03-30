export interface ChatMessage {
  id: string;
  chatId?: string;  // Added chatId for identifying which chat a message belongs to
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

export interface User {
  id: string;
  username: string;
  isOnline: boolean;
}