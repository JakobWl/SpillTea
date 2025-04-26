import axios from "axios";
import config from "../config";
import { ChatsClient, UsersClient } from "./client";

export const axiosInstance = axios.create({
	baseURL: config.apiUrl,
	withCredentials: true,
});

const chatsClient = new ChatsClient(undefined, axiosInstance);
const usersClient = new UsersClient(undefined, axiosInstance);

export { chatsClient, usersClient };
