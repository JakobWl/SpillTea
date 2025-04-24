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
import { ChatMessage } from "../types/chat";
import ChatBubble from "../components/ChatBubble";
import { useAuth } from "../contexts/AuthContext";

type ChatConversationScreenProps = NativeStackScreenProps<
  MainTabParamList,
  "ChatConversation"
>;

const ChatScreen = ({ route, navigation }: ChatConversationScreenProps) => {
  const { chatId } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Set the header title
  useLayoutEffect(() => {
    navigation.setOptions({
      title: chatId.toString(),
    });
  }, [navigation, chatId]);

  useEffect(() => {
    let unsubscribeMessageHandler: (() => void) | null = null;

    const connectToChat = async () => {
      setIsConnecting(true);
      setError(null);

      try {
        await signalRService.startConnection();

        // Join the specific chat room
        await signalRService.joinChat(chatId);

        // Register event handler for this specific chat
        unsubscribeMessageHandler = signalRService.onMessageReceived(
          (message) => {
            // Only add messages for this chat
            if (message.chatId === chatId) {
              setMessages((prevMessages) => [...prevMessages, message]);

              // Scroll to bottom when new message arrives
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }
          },
        );

        setIsConnecting(false);

        // Simulate fetching chat history from API
        setTimeout(() => {}, 500);
      } catch (err) {
        setError("Failed to connect to chat. Please try again later.");
        setIsConnecting(false);
        console.error("Error connecting to SignalR hub:", err);
      }
    };

    connectToChat().then();

    // Cleanup on unmount
    return () => {
      if (unsubscribeMessageHandler) {
        unsubscribeMessageHandler();
      }
      // Leave the chat room when component unmounts
      signalRService.leaveChat(chatId).catch((err) => {
        console.error(`Error leaving chat ${chatId}:`, err);
      });
    };
  }, [chatId, user]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      // For a real app, we'll use SignalR
      await signalRService.sendMessage(chatId, newMessage);

      // Add it locally for immediate feedback
      const newMsg: ChatMessage = {
        id: `${chatId}-msg-${Date.now()}`,
        chatId: chatId,
        senderId: user.id!,
        senderName: user.name!,
        content: newMessage,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, newMsg]);
      setNewMessage("");

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again.");
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

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatBubble
            message={item}
            isOwnMessage={item.senderId === user?.id}
          />
        )}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
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
