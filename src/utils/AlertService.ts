import { Alert, ToastAndroid, Platform } from "react-native";

export class AlertService {
    /**
     * Extracts a user-friendly error message from a backend error response
     */
    private static extractError(err: any, defaultMsg: string = "An error occurred"): string {
        return (
            err.response?.data?.details?.[0]?.message ||
            err.response?.data?.error ||
            err.message ||
            defaultMsg
        );
    }

    /**
     * Shows a standard error Alert
     */
    static error(err: any, defaultMsg: string = "Something went wrong", title: string = "Error") {
        const message = this.extractError(err, defaultMsg);
        Alert.alert(title, message);
    }

    /**
     * Shows a success Alert
     */
    static success(title: string, message: string) {
        Alert.alert(title, message);
    }

    /**
     * Shows a small toast notification (Android only, or fallback for iOS)
     */
    static toast(message: string) {
        if (Platform.OS === "android") {
            ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
            // For iOS, we don't have a native Toast like Android.
            // We could use a library, but sticking to vanilla, we could use a simple Alert
            // or just log it if it's meant to be non-intrusive.
            // For now, let's use a simple Alert title-less if possible or just Alert.
            Alert.alert("", message);
        }
    }

    /**
     * Shows a confirmation dialog
     */
    static confirm(title: string, message: string, onConfirm: () => void, confirmText: string = "Confirm", cancelText: string = "Cancel") {
        Alert.alert(title, message, [
            { text: cancelText, style: "cancel" },
            { text: confirmText, onPress: onConfirm },
        ]);
    }
}
