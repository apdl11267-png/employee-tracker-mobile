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
} from "react-native";
import { useMutation } from "@tanstack/react-query";
import { createEmployee, CreateEmployeePayload } from "../api/authApi";
import { colors } from "../theme/colors";
import { AlertService } from "../components/AlertService";
import {
  ChevronLeft,
  UserPlus,
  Mail,
  Briefcase,
  Calendar,
  Eye,
  EyeOff,
} from "lucide-react-native";
import { Lock } from "lucide-react-native/icons";

export default function CreateEmployeeScreen({ navigation }: any) {
  const [form, setForm] = useState<CreateEmployeePayload>({
    displayName: "",
    email: "",
    role: "EMPLOYEE",
    department: "",
    totalLeave: 25,
    remainingLeave: 25,
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      AlertService.success("Success", "Employee created successfully.");
      navigation.goBack();
    },
    onError: (error: any) => {
      AlertService.error(error, "Failed to create employee.");
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
    mutation.mutate(form);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Employee</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputWrapper}>
            <UserPlus size={20} color={colors.neutral.base} />
            <TextInput
              style={styles.input}
              placeholder="System Admin"
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
              // This toggles the dots
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

        <View style={styles.roleGroup}>
          <Text style={styles.label}>Role</Text>
          <View style={styles.row}>
            {["EMPLOYEE", "ADMIN", "HR_ADMIN"].map((r: any) => (
              <TouchableOpacity
                key={r}
                style={[styles.pill, form.role === r && styles.pillActive]}
                onPress={() => setForm({ ...form, role: r })}
              >
                <Text
                  style={[
                    styles.pillText,
                    form.role === r && styles.pillTextActive,
                  ]}
                >
                  {r.replace("_", " ")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Department</Text>
          <View style={styles.inputWrapper}>
            <Briefcase size={20} color={colors.neutral.base} />
            <TextInput
              style={styles.input}
              placeholder="Management"
              value={form.department}
              onChangeText={(t) => setForm({ ...form, department: t })}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Total Leaves</Text>
            <View style={styles.inputWrapper}>
              <Calendar size={20} color={colors.neutral.base} />
              <TextInput
                style={styles.input}
                placeholder="25"
                keyboardType="numeric"
                value={form.totalLeave.toString()}
                onChangeText={(t) =>
                  setForm({ ...form, totalLeave: parseInt(t) || 0 })
                }
              />
            </View>
          </View>
          <View style={{ width: 16 }} />
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Remaining Leave</Text>
            <View style={styles.inputWrapper}>
              <Calendar size={20} color={colors.neutral.base} />
              <TextInput
                style={styles.input}
                placeholder="25"
                keyboardType="numeric"
                value={form.remainingLeave.toString()}
                onChangeText={(t) =>
                  setForm({ ...form, remainingLeave: parseInt(t) || 0 })
                }
              />
            </View>
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
            <Text style={styles.submitBtnText}>Create Employee</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.light,
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
  roleGroup: {
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
  },
  eyeIcon: {
    padding: 4, // Makes the tap target slightly larger
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text.muted,
  },
  pillTextActive: {
    color: "#fff",
  },
  submitBtn: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    shadowColor: colors.primary,
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
