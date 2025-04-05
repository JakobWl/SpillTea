import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Avatar, Button, Card, Divider, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";

const ProfileScreen = () => {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.headerContainer}>
          <Avatar.Text
            size={80}
            label={user?.name.substring(0, 2).toUpperCase() || "U"}
            style={styles.avatar}
          />
          <Text style={styles.nameText}>{user?.name || "User"}</Text>
          {user?.email && <Text style={styles.emailText}>{user.email}</Text>}
        </View>

        <Card style={styles.card}>
          <Card.Title title="Profile Information" />
          <Card.Content>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>User ID:</Text>
              <Text style={styles.infoValue}>
                {user?.id || "Not available"}
              </Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>
                {user?.name || "Not available"}
              </Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>
                {user?.email || "Not available"}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button mode="contained" onPress={logout} style={styles.button}>
            Logout
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerContainer: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#6200ee",
  },
  avatar: {
    backgroundColor: "#3700b3",
    marginBottom: 10,
  },
  nameText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  emailText: {
    fontSize: 16,
    color: "#e1e1e1",
  },
  card: {
    margin: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  infoLabel: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#555",
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    textAlign: "right",
  },
  divider: {
    marginVertical: 4,
  },
  buttonContainer: {
    padding: 16,
  },
  button: {
    marginVertical: 10,
  },
});

export default ProfileScreen;
