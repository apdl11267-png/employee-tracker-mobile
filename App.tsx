import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider } from "./src/context/AuthContext";
import { TenantProvider } from "./src/context/TenantContext";
import AppNavigator from "./src/navigation";
import { colors } from "./src/theme/colors";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { GlobalToast, toastRef } from "./src/components/AlertService";

const queryClient = new QueryClient();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <TenantProvider>
            <AuthProvider>
              <NavigationContainer>
                <BottomSheetModalProvider>
                  <SafeAreaView style={styles.container}>
                    <AppNavigator />
                  </SafeAreaView>
                  <StatusBar style="auto" />
                  <GlobalToast ref={toastRef} />
                </BottomSheetModalProvider>
              </NavigationContainer>
            </AuthProvider>
          </TenantProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.light,
  },
});
