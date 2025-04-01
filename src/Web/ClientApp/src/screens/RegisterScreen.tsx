import React, { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../navigation/AppNavigator";
import { authClient } from "../clients";
import { RegisterRequest } from "../web-api-client";

type RegisterScreenProps = NativeStackScreenProps<
  AuthStackParamList,
  "Register"
>;

const RegisterScreen = ({ navigation }: RegisterScreenProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureConfirmTextEntry, setSecureConfirmTextEntry] = useState(true);

  const validateForm = () => {
    if (!name || !email || !password || !confirmPassword) {
      setErrorMessage("All fields are required");
      return false;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return false;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      return false;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("Please enter a valid email address");
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      // Create registration request
      const registerRequest = {
        email,
        password,
      } as RegisterRequest;

      await authClient.postRegister(registerRequest);
      setIsLoading(false);
      navigation.navigate("Login");
    } catch (error) {
      setErrorMessage("Registration failed. Please try again.");
      console.error("Registration error:", error);
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <TextInput
            label="Full Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            disabled={isLoading}
          />

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            mode="outlined"
            style={styles.input}
            disabled={isLoading}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureTextEntry}
            mode="outlined"
            style={styles.input}
            disabled={isLoading}
            right={
              <TextInput.Icon
                icon={secureTextEntry ? "eye-off" : "eye"}
                onPress={() => setSecureTextEntry(!secureTextEntry)}
              />
            }
          />

          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={secureConfirmTextEntry}
            mode="outlined"
            style={styles.input}
            disabled={isLoading}
            right={
              <TextInput.Icon
                icon={secureConfirmTextEntry ? "eye-off" : "eye"}
                onPress={() =>
                  setSecureConfirmTextEntry(!secureConfirmTextEntry)
                }
              />
            }
          />

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
          >
            Create Account
          </Button>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
              disabled={isLoading}
            >
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
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
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  formContainer: {
    flex: 1,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "white",
  },
  button: {
    marginTop: 8,
    padding: 5,
    borderRadius: 8,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    marginTop: -5,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginText: {
    marginRight: 5,
  },
  loginLink: {
    color: "#6200ee",
    fontWeight: "500",
  },
});

export default RegisterScreen;
