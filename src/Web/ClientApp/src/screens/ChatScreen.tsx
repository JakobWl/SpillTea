import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import signalRService from '../services/signalRService';
import { ChatMessage } from '../types/chat';
import ChatBubble from '../components/ChatBubble';

const ChatScreen = () => {
  const [user, setUser] = useState<{id: string, name: string} | null>({id: '1', name: 'User'});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    let unsubscribeMessageHandler: (() => void) | null = null;
    
    const connectToChat = async () => {
      setIsConnecting(true);
      setError(null);
      
      try {
        await signalRService.startConnection();
        
        // Register event handler
        unsubscribeMessageHandler = signalRService.onMessageReceived((message) => {
          setMessages(prevMessages => [...prevMessages, message]);
          
          // Scroll to bottom when new message arrives
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        });
        
        setIsConnecting(false);

        // Add some sample messages for testing
        const sampleMessages: ChatMessage[] = [
          {
            id: '1',
            senderId: '2',
            senderName: 'John',
            content: 'Hello there!',
            timestamp: new Date().toISOString()
          },
          {
            id: '2',
            senderId: '1',
            senderName: 'You',
            content: 'Hi John, how are you?',
            timestamp: new Date().toISOString()
          },
          {
            id: '3',
            senderId: '2',
            senderName: 'John',
            content: 'I\'m doing great, thanks for asking!',
            timestamp: new Date().toISOString()
          }
        ];
        setMessages(sampleMessages);
      } catch (err) {
        setError('Failed to connect to chat. Please try again later.');
        setIsConnecting(false);
        console.error('Error connecting to SignalR hub:', err);
      }
    };
    
    connectToChat();
    
    // Cleanup on unmount
    return () => {
      if (unsubscribeMessageHandler) {
        unsubscribeMessageHandler();
      }
      
      signalRService.stopConnection();
    };
  }, []);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    
    try {
      // In a real app, this would go through SignalR
      // await signalRService.sendMessage(newMessage);
      
      // For demo, we'll just add it locally
      const newMsg: ChatMessage = {
        id: Math.random().toString(),
        senderId: user.id,
        senderName: user.name,
        content: newMessage,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
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
    <SafeAreaView style={styles.container}>
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
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            mode="outlined"
          />
          <Button
            mode="contained"
            onPress={sendMessage}
            disabled={!newMessage.trim()}
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
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#444',
  },
  errorContainer: {
    padding: 10,
    backgroundColor: '#ffebee',
    borderRadius: 5,
    margin: 10,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  messagesContainer: {
    padding: 10,
    paddingBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  sendButton: {
    justifyContent: 'center',
  },
});

export default ChatScreen;