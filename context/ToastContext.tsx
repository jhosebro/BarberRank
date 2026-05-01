import { createContext, useContext, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

type ToastType = "success" | "error" | "info";

interface Toast {
  type: ToastType;
  message: string;
}

interface ToastContextProps {
  showToast: (toast: Toast) => void;
}

const ToastContext = createContext<ToastContextProps>({
  showToast: () => {},
});

export const ToastProvider = ({ children }: any) => {
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (toast: Toast) => {
    setToast(toast);

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {toast && (
        <View
          style={[
            styles.container,
            toast.type === "error"
              ? styles.error
              : toast.type === "success"
                ? styles.success
                : styles.info,
          ]}
        >
          <Text style={styles.text}>{toast.message}</Text>
        </View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    padding: 14,
    borderRadius: 12,
    minWidth: "70%",
    alignItems: "center",
    zIndex: 999,
  },
  text: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  success: {
    backgroundColor: "#22c55e",
  },
  error: {
    backgroundColor: "#ef4444",
  },
  info: {
    backgroundColor: "#3b82f6",
  },
});
