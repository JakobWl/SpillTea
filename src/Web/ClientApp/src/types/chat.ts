export interface ChatMessage {
    id: string;
    chatId?: number;  // Added chatId for identifying which chat a message belongs to
    senderId: string;
    senderName: string;
    content: string;
    timestamp: string;
  }