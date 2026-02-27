import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useMutation } from "@tanstack/react-query";
import { registerFirstAdmin } from "../api/authApi";
import { colors } from "../theme/colors";
import { AlertService } from "../components/AlertService";
import { useTenant } from "../context/TenantContext";
import {
  ChevronLeft,
  UserPlus,
  Mail,
  Briefcase,
  Eye,
  EyeOff,
  Building2,
} from "lucide-react-native";
import { Lock } from "lucide-react-native/icons";

export default function RegisterAdminScreen({ navigation }: any) {
  const { currentTenant, clearTenant } = useTenant();
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    department: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useMutation({
    mutationFn: registerFirstAdmin,
    onSuccess: () => {
      AlertService.success(
        "Success",
        "Administrator account created! You can now log in.",
      );
      navigation.navigate("Login");
    },
    onError: (error: any) => {
      AlertService.error(error, "Failed to register admin.");
    },
  });

  const handleSubmit = () => {
    if (
      !form.displayName ||
      !form.email ||
      !form.department ||
      !form.password
    ) {
      AlertService.error({}, "Please fill in all required fields.");
      return;
    }

    if (!currentTenant) {
      AlertService.error({}, "Organization context missing.");
      return;
    }

    mutation.mutate({
      ...form,
      tenantId: currentTenant.id,
    });
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={clearTenant} style={styles.backButton}>
            <ChevronLeft size={28} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Setup Admin</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.infoBox}>
            <View style={styles.tenantBadge}>
              <Building2 size={16} color={colors.secondary} />
              <Text style={styles.tenantName}>{currentTenant?.name}</Text>
            </View>
            <Text style={styles.infoText}>
              This organization is new. Please create the first administrator
              account to get started.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <UserPlus size={20} color={colors.neutral.base} />
              <TextInput
                style={styles.input}
                placeholder="e.g. John Doe"
                value={form.displayName}
                onChangeText={(t) => setForm({ ...form, displayName: t })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Mail size={20} color={colors.neutral.base} />
              <TextInput
                style={styles.input}
                placeholder="admin@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(t) => setForm({ ...form, email: t })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={20} color={colors.neutral.base} />
              <TextInput
                style={styles.input}
                placeholder="Enter Password"
                secureTextEntry={!showPassword}
                value={form.password}
                onChangeText={(t) => setForm({ ...form, password: t })}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                {showPassword ? (
                  <Eye size={20} color={colors.neutral.base} />
                ) : (
                  <EyeOff size={20} color={colors.neutral.base} />
                )}
              </Pressable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Department</Text>
            <View style={styles.inputWrapper}>
              <Briefcase size={20} color={colors.neutral.base} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Management / IT"
                value={form.department}
                onChangeText={(t) => setForm({ ...form, department: t })}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, mutation.isPending && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Create Admin Account</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primary,
  },
  scroll: {
    padding: 24,
  },
  infoBox: {
    backgroundColor: colors.neutral.light,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tenantBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  tenantName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.secondary,
    marginLeft: 6,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.main,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text.main,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 52,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text.main,
  },
  eyeIcon: {
    padding: 4,
  },
  submitBtn: {
    backgroundColor: colors.secondary,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
