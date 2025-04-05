import axios from "axios";
import { ChatClient, Client, UserClient } from "./client";
import config from "../config";

export const axiosInstance = axios.create({
  baseURL: config.apiUrl,
});

const authClient = new Client(undefined, axiosInstance);
const chatClient = new ChatClient(undefined, axiosInstance);
const userClient = new UserClient(undefined, axiosInstance);

export { authClient, chatClient, userClient };
