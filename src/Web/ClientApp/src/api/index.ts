import axios from "axios";
import { AuthClient, ChatClient, Client, UserClient } from "./client";
import config from "../config";

export const axiosInstance = axios.create({
	baseURL: config.apiUrl,
});

const identityClient = new Client(undefined, axiosInstance);
const authClient = new AuthClient(undefined, axiosInstance);
const chatClient = new ChatClient(undefined, axiosInstance);
const userClient = new UserClient(undefined, axiosInstance);

export { identityClient, chatClient, userClient, authClient };
