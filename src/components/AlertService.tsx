import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useRef,
} from "react";
import { Alert, Platform, Animated, StyleSheet, Text } from "react-native";

// --- GLOBAL REF ---
export const toastRef = React.createRef<any>();

// --- THE ALERT SERVICE ---
export class AlertService {
  private static extractError(
    err: any,
    defaultMsg: string = "An error occurred",
  ): string {
    if (typeof err === "string") return err;
    return (
      err.response?.data?.details?.[0]?.message ||
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      defaultMsg
    );
  }

  static error(
    err: any,
    defaultMsg: string = "Something went wrong",
    title: string = "Error",
  ) {
    const message = this.extractError(err, defaultMsg);
    Alert.alert(title, message, [{ text: "OK", style: "cancel" }]);
  }

  static success(message: string, title: string = "Success") {
    Alert.alert(title, message, [{ text: "Done", style: "default" }]);
  }

  /**
   * Professional Top Toast
   * @param type 'info' | 'success' | 'error'
   */
  static toast({
    message,
    type = "info",
    timeout = 1000,
    position = "top",
  }: {
    message: string;
    type?: "info" | "success" | "error";
    timeout?: number;
    position?: "top" | "bottom";
  }) {
    if (toastRef.current) {
      toastRef.current.show(message, type, timeout, position);
      // console.log("Toast shown:", message);
    } else {
      console.log("Toast fallback:", message);
    }
  }

  static confirm(title: string, message: string, onConfirm: () => void) {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: onConfirm, style: "default" },
    ]);
  }
}

// --- THE CUSTOM TOAST COMPONENT ---
export const GlobalToast = forwardRef((props, ref) => {
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "success" | "error">("info");
  const [visible, setVisible] = useState(false);

  const translateY = useRef(new Animated.Value(-150)).current;

  useImperativeHandle(ref, () => ({
    show: (
      msg: string,
      toastType: "info" | "success" | "error" = "info",
      timeout: number = 1000,
      position: "top" | "bottom" = "top",
    ) => {
      setMessage(msg);
      setType(toastType);
      setVisible(true);

      Animated.spring(translateY, {
        toValue: Platform.OS === "ios" ? 50 : 30,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start();

      setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -750,
          duration: 150,
          useNativeDriver: true,
        }).start(() => setVisible(false));
      }, timeout);
    },
  }));

  if (!visible) return null;

  const bgColors = {
    info: "#569ee6ff", // Midnight Blue
    success: "#27AE60", // Emerald Green
    error: "#E74C3C", // Alizarin Red
  };

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY }],
          backgroundColor: bgColors[type],
        },
      ]}
    >
      <Text style={styles.toastText}> {message} </Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    bottom: 100,
    left: "5%",
    right: "5%",
    width: "90%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 9999,
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
});
