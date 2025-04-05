import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Avatar,
  Button,
  Card,
  Text,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { User } from "../types/chat";
import signalRService from "../services/signalRService";

const UsersScreen = () => {
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>({
    id: "1",
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeUserConnected: (() => void) | null = null;
    let unsubscribeUserDisconnected: (() => void) | null = null;
    let unsubscribeActiveUsers: (() => void) | null = null;

    const setupSignalR = async () => {
      setLoading(true);
      setError(null);

      try {
        await signalRService.startConnection();

        // Register event handlers
        unsubscribeUserConnected = signalRService.onUserConnected(
          (userId, username) => {
            setUsers((prevUsers) => {
              const existingUser = prevUsers.find((u) => u.id === userId);

              if (existingUser) {
                // Update existing user
                return prevUsers.map((u) =>
                  u.id === userId ? { ...u, isOnline: true } : u,
                );
              } else {
                // Add new user
                return [...prevUsers, { id: userId, username, isOnline: true }];
              }
            });
          },
        );

        unsubscribeUserDisconnected = signalRService.onUserDisconnected(
          (userId) => {
            setUsers((prevUsers) =>
              prevUsers.map((u) =>
                u.id === userId ? { ...u, isOnline: false } : u,
              ),
            );
          },
        );

        unsubscribeActiveUsers = signalRService.onActiveUsers((userIds) => {
          // This would be more complex in a real app where you'd need to fetch user details
          // Simplified for demo purposes
          const activeUsers = userIds.map((id, index) => ({
            id,
            username: `User ${index + 1}`,
            isOnline: true,
          }));

          setUsers(activeUsers);
        });

        setLoading(false);

        // Sample users for testing
        const sampleUsers: User[] = [
          { id: "1", username: "You", isOnline: true },
          { id: "2", username: "John", isOnline: true },
          { id: "3", username: "Sarah", isOnline: true },
          { id: "4", username: "Mike", isOnline: false },
          { id: "5", username: "Emma", isOnline: true },
        ];
        setUsers(sampleUsers);
      } catch (err) {
        setError("Failed to connect to user service. Please try again later.");
        setLoading(false);
        console.error("Error connecting to SignalR hub:", err);
      }
    };

    setupSignalR();

    // Cleanup on unmount
    return () => {
      if (unsubscribeUserConnected) {
        unsubscribeUserConnected();
      }

      if (unsubscribeUserDisconnected) {
        unsubscribeUserDisconnected();
      }

      if (unsubscribeActiveUsers) {
        unsubscribeActiveUsers();
      }
    };
  }, []);

  const startChat = (userId: string) => {
    // In a complete app, this would navigate to a private chat or open a modal
    console.log(`Start chat with user ${userId}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  // Filter out current user
  const filteredUsers = users.filter((u) => u.id !== currentUser?.id);

  return (
    <SafeAreaView style={styles.container}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Text style={styles.headerText}>Online Users</Text>

      {filteredUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No other users are online right now
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.userCard}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.userInfo}>
                  <Avatar.Text
                    size={40}
                    label={item.username.substring(0, 2).toUpperCase()}
                  />
                  <View style={styles.userMeta}>
                    <Text style={styles.username}>{item.username}</Text>
                    <View style={styles.statusContainer}>
                      <View
                        style={[
                          styles.statusDot,
                          item.isOnline ? styles.onlineDot : styles.offlineDot,
                        ]}
                      />
                      <Text style={styles.statusText}>
                        {item.isOnline ? "Online" : "Offline"}
                      </Text>
                    </View>
                  </View>
                </View>

                {item.isOnline && (
                  <Button mode="contained" onPress={() => startChat(item.id)}>
                    Chat
                  </Button>
                )}
              </Card.Content>
            </Card>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    margin: 16,
    color: "#333",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
  },
  listContent: {
    padding: 10,
  },
  userCard: {
    marginBottom: 10,
    elevation: 2,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userMeta: {
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  onlineDot: {
    backgroundColor: "#4caf50",
  },
  offlineDot: {
    backgroundColor: "#9e9e9e",
  },
  statusText: {
    fontSize: 12,
    color: "#666",
  },
});

export default UsersScreen;
