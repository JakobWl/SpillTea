import axios from "axios";
import config from "../config";
import { ChatsClient, UsersClient } from "./client";
import { Platform } from "react-native";
import * as SecureStore from 'expo-secure-store';

const COOKIE_STORAGE_KEY = "spilltea.cookie";

export const axiosInstance = axios.create({
	baseURL: config.apiUrl,
	withCredentials: true,
});

// On native platforms, we need to manually handle the session cookie.
// `withCredentials` is not sufficient, so we use interceptors
// to save the cookie from responses and attach it to requests.
if (Platform.OS !== "web") {
	// 1) Intercept *incoming* responses to capture any Set-Cookie headers
	axiosInstance.interceptors.response.use(
		async (response) => {
			const setCookieHeader = response.headers["set-cookie"];
			if (setCookieHeader) {
				// We are assuming the first cookie in the array is the session cookie
				const cookie = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
				// We store the 'key=value' part of the cookie, without attributes like HttpOnly, Path, etc.
				await SecureStore.setItemAsync(COOKIE_STORAGE_KEY, cookie.split(';')[0]);
			}
			return response;
		},
		(error) => Promise.reject(error)
	);

	// 2) Intercept *outgoing* requests to attach the stored cookie
	axiosInstance.interceptors.request.use(
		async (config) => {
			const cookie = await SecureStore.getItemAsync(COOKIE_STORAGE_KEY);
			if (cookie) {
				config.headers = config.headers ?? {};
				(config.headers as any)["Cookie"] = cookie;
			}
			return config;
		},
		(error) => Promise.reject(error)
	);
}

const chatsClient = new ChatsClient(undefined, axiosInstance);
const usersClient = new UsersClient(undefined, axiosInstance);

export { chatsClient, usersClient };
