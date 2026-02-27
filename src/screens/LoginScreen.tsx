import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTenant } from "../context/TenantContext";
import { colors } from "../theme/colors";
import { login, checkTenantAdmin } from "../api/authApi";
import { AlertService } from "../components/AlertService";
import { Building2, LogIn, ChevronLeft } from "lucide-react-native";
import { useEffect } from "react";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminChecking, setIsAdminChecking] = useState(true);
  const { signIn } = useAuth();
  const { currentTenant, clearTenant } = useTenant();

  useEffect(() => {
    const checkAdmin = async () => {
      if (currentTenant) {
        try {
          const { hasAdmin } = await checkTenantAdmin(currentTenant.id);
          if (!hasAdmin) {
            navigation.replace("RegisterAdmin");
            return;
          }
        } catch (error) {
          console.error("Check admin error:", error);
        } finally {
          setIsAdminChecking(false);
        }
      } else {
        setIsAdminChecking(false);
      }
    };
    checkAdmin();
  }, [currentTenant, navigation]);

  const handleLogin = async () => {
    if (!email || !password) {
      AlertService.error({}, "Please fill in all fields");
      return;
    }

    if (!currentTenant) {
      AlertService.error({}, "Organization not selected");
      return;
    }

    setIsLoading(true);
    try {
      const response = await login({
        email,
        password,
        tenantId: currentTenant.id,
      });

      const { accessToken, refreshToken, employee } = response.data;

      const userData = {
        id: employee.id || employee._id,
        email: employee.email,
        displayName: employee.displayName,
        role: employee.role,
      };

      await signIn(accessToken, refreshToken, userData);
    } catch (error: any) {
      console.error("Login error:", error);
      AlertService.error(
        error,
        "Failed to login. Please check your credentials.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      {isAdminChecking ? (
        <View style={[styles.container, styles.center]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Configuring your workspace...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <TouchableOpacity style={styles.backButton} onPress={clearTenant}>
              <ChevronLeft size={20} color={colors.neutral.base} />
              <Text style={styles.backText}>Switch Organization</Text>
            </TouchableOpacity>

            <View style={styles.header}>
              <View style={styles.tenantBadge}>
                <Building2 size={16} color={colors.secondary} />
                <Text style={styles.tenantName}>{currentTenant?.name}</Text>
              </View>
              <Text style={styles.title}>TrackLeave</Text>
              <Text style={styles.subtitle}>Sign in to manage your leave</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Sign In</Text>
                    <LogIn size={20} color="#fff" style={styles.loginIcon} />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>
                  Forgot Password? Contact Admin
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
  },
  backText: {
    fontSize: 14,
    color: colors.neutral.base,
    marginLeft: 4,
    fontWeight: "500",
  },
  header: {
    marginBottom: 40,
  },
  tenantBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.neutral.light,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tenantName: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.secondary,
    marginLeft: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.neutral.base,
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.neutral.base,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#F8FAFC",
    color: colors.text.main,
  },
  loginButton: {
    height: 52,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  loginIcon: {
    marginLeft: 8,
  },
  forgotPassword: {
    alignItems: "center",
    marginTop: 8,
  },
  forgotPasswordText: {
    color: colors.neutral.base,
    fontSize: 14,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.neutral.base,
    fontWeight: "500",
  },
});
