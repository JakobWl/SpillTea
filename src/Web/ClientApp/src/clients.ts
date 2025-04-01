import {ChatClient, Client} from "./web-api-client";

const authClient = new Client();
const chatClient = new ChatClient();

export { authClient, chatClient };