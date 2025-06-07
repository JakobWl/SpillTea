import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { ChatMessageDto, MessageState } from "../api/client";
import { MaterialCommunityIcons } from "../utils/materialIcons";
import { formatTimestamp } from "../utils/dateTime";

interface ChatBubbleProps {
	message: ChatMessageDto;
	isOwnMessage: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isOwnMessage }) => {
	return (
		<View
			style={[
				styles.container,
				isOwnMessage
					? styles.ownMessageContainer
					: styles.otherMessageContainer,
			]}
		>
			{!isOwnMessage && (
				<Text style={styles.senderName}>{message.senderId}</Text>
			)}

			<View
				style={[
					styles.bubble,
					isOwnMessage ? styles.ownBubble : styles.otherBubble,
				]}
			>
				<Text
					style={[
						styles.messageText,
						isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
					]}
				>
					{message.body}
				</Text>
			</View>

                        <View style={styles.footer}>
                                <Text style={styles.timeText}>{formatTimestamp(message.timeStamp)}</Text>
                                {isOwnMessage && (
                                        <MaterialCommunityIcons
                                                name={
                                                        message.state === MessageState.Read
                                                                ? "check-all"
                                                                : message.state === MessageState.Received
                                                                ? "check"
                                                                : "clock"
                                                }
                                                size={14}
                                                color="#888"
                                        />
                                )}
                        </View>
                </View>
        );
};

const styles = StyleSheet.create({
	container: {
		marginVertical: 5,
		maxWidth: "80%",
	},
	ownMessageContainer: {
		alignSelf: "flex-end",
		marginRight: 10,
	},
	otherMessageContainer: {
		alignSelf: "flex-start",
		marginLeft: 10,
	},
	senderName: {
		fontSize: 12,
		color: "#666",
		marginBottom: 2,
		marginLeft: 4,
	},
	bubble: {
		borderRadius: 18,
		paddingHorizontal: 14,
		paddingVertical: 10,
	},
	ownBubble: {
		backgroundColor: "#6200ee",
	},
	otherBubble: {
		backgroundColor: "#e4e4e4",
	},
	messageText: {
		fontSize: 16,
	},
	ownMessageText: {
		color: "#fff",
	},
	otherMessageText: {
		color: "#000",
	},
        timeText: {
                fontSize: 10,
                color: "#888",
                marginTop: 2,
                alignSelf: "flex-end",
                marginRight: 4,
        },
        footer: {
                flexDirection: "row",
                alignItems: "center",
                alignSelf: "flex-end",
                gap: 4,
        },
});

export default ChatBubble;
