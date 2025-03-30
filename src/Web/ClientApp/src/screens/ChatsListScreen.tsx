import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Text, Avatar, FAB, Divider, ActivityIndicator, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainTabParamList } from '../navigation/AppNavigator';
import signalRService from '../services/signalRService';

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  avatar?: string;
}

type ChatsListNavigationProp = NativeStackNavigationProp<MainTabParamList, 'ChatsList'>;

const ChatsListScreen = () => {
  const navigation = useNavigation<ChatsListNavigationProp>();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFindingChat, setIsFindingChat] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate fetching chats from an API
    const fetchChats = async () => {
      setIsLoading(true);
      
      try {
        // Mock data for demonstration
        const mockChats: Chat[] = [
          {
            id: '1',
            name: 'John Doe',
            lastMessage: 'Hey, how are you doing?',
            timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
            unreadCount: 2,
            avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=random'
          },
          {
            id: '2',
            name: 'Sarah Miller',
            lastMessage: 'See you tomorrow!',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
            unreadCount: 0,
            avatar: 'https://ui-avatars.com/api/?name=Sarah+Miller&background=random'
          },
          {
            id: '3',
            name: 'Random User #542',
            lastMessage: 'Nice talking to you!',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            unreadCount: 0,
            avatar: 'https://ui-avatars.com/api/?name=Random+User&background=random'
          },
          {
            id: '4',
            name: 'Alex Johnson',
            lastMessage: 'Let me know when you arrive',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            unreadCount: 0,
            avatar: 'https://ui-avatars.com/api/?name=Alex+Johnson&background=random'
          },
          {
            id: '5',
            name: 'Emily Davis',
            lastMessage: 'Thanks for the info!',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
            unreadCount: 0,
            avatar: 'https://ui-avatars.com/api/?name=Emily+Davis&background=random'
          },
        ];
        
        setChats(mockChats);
      } catch (error) {
        console.error('Error fetching chats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchChats();
  }, []);

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Today - show time
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      // Yesterday
      return 'Yesterday';
    } else if (diffDays < 7) {
      // Within a week - show day name
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      // Older - show date
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleChatPress = (chatId: string, chatName: string) => {
    navigation.navigate('ChatConversation', { 
      chatId: chatId,
      chatName: chatName
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
      navigation.navigate('ChatConversation', { 
        chatId: chatId,
        chatName: 'Random User #' + Math.floor(Math.random() * 1000)
      });
    } catch (err) {
      console.error('Error finding random chat:', err);
      setError('Failed to find random chat. Please try again later.');
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
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.chatItem} 
            onPress={() => handleChatPress(item.id, item.name)}
          >
            <Avatar.Image 
              source={{ uri: item.avatar }} 
              size={50} 
              style={styles.avatar}
            />
            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatName}>{item.name}</Text>
                <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
              </View>
              <View style={styles.chatFooter}>
                <Text 
                  style={styles.lastMessage} 
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.lastMessage}
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
          label: 'Dismiss',
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
  listContent: {
    paddingBottom: 80, // Add space for FAB
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
  },
  avatar: {
    marginRight: 16,
    backgroundColor: '#e0e0e0',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    color: '#757575',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#757575',
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#6200ee',
    borderRadius: 12,
    height: 24,
    minWidth: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee',
  },
});

export default ChatsListScreen;