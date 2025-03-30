export interface ChatMessage {
  id: string;
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