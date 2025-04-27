import axios from "axios";
import config from "../config";
import { ChatsClient, UsersClient } from "./client";
import { Platform } from "react-native";

export const axiosInstance = axios.create({
	baseURL: config.apiUrl,
	withCredentials: true,
});

let CookieManager: typeof import("@react-native-cookies/cookies") | null = null;

if (Platform.OS !== "web") {
  CookieManager = require("@react-native-cookies/cookies").default;
}

// 1) Intercept *incoming* responses to capture any Set-Cookie headers
axiosInstance.interceptors.response.use(
	async (resp) => {
		if (CookieManager) {
		const hdr = resp.headers["set-cookie"];
		if (hdr) {
			const cookies = Array.isArray(hdr) ? hdr : [hdr];
			for (const header of cookies) {
			await CookieManager.default.setFromResponse(config.apiUrl, header);
			}
		}
		}
		return resp;
	},
	(err) => Promise.reject(err)
);
  
// 2) Intercept *outgoing* requests to attach stored cookies
axiosInstance.interceptors.request.use(
	async (cfg) => {
		if (CookieManager) {
		const stored = await CookieManager.default.get(config.apiUrl);
		const cookieString = Object
			.values(stored)
			.map(c => `${c.name}=${c.value}`)
			.join("; ");
		if (cookieString) {
			cfg.headers = cfg.headers ?? {};
			(cfg.headers as any)["Cookie"] = cookieString;
		}
		}
		return cfg;
	},
	(err) => Promise.reject(err)
);

const chatsClient = new ChatsClient(undefined, axiosInstance);
const usersClient = new UsersClient(undefined, axiosInstance);

export { chatsClient, usersClient };
