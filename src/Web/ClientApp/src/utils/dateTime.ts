import { DateTime } from "luxon";

export const formatTimestamp = (isoString: DateTime) => {
    const date = new Date(isoString.toString());
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        // Today - show time
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    } else if (diffDays === 1) {
        // Yesterday
        return "Yesterday";
    } else if (diffDays < 7) {
        // Within a week - show day name
        return date.toLocaleDateString([], { weekday: "short" });
    } else {
        // Older - show date
        return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
};