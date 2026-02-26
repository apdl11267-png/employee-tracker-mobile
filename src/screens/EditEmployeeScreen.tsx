import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  employeeApi,
  EmployeeData,
  UpdateEmployeePayload,
} from "../api/employeeApi";
import { colors } from "../theme/colors";
import { AlertService } from "../components/AlertService";
import {
  ChevronLeft,
  Save,
  User,
  Mail,
  Briefcase,
  Lock,
  Calendar,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const InputField = ({
  label,
  value,
  onChangeText,
  icon: Icon,
  keyboardType,
  secureTextEntry,
  placeholder,
}: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      <Icon size={20} color={colors.text.muted} style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
      />
    </View>
  </View>
);

export default function EditEmployeeScreen({ route, navigation }: any) {
  const { employee } = route.params as { employee: EmployeeData };
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    displayName: employee.displayName,
    email: employee.email,
    department: employee.department,
    role: employee.role,
    totalLeave: employee.totalLeave.toString(),
    remainingLeave: employee.remainingLeave.toString(),
    password: "",
  });

  const mutation = useMutation({
    mutationFn: (data: UpdateEmployeePayload) =>
      employeeApi.updateEmployee(employee._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      AlertService.toast({
        message: "Employee updated successfully.",
        type: "success",
      });
      navigation.goBack();
    },
    onError: (error: any) => {
      AlertService.error(error, "Update failed.");
    },
  });

  const handleSave = () => {
    if (!formData.displayName || !formData.email || !formData.department) {
      AlertService.toast({
        message: "Please fill required fields",
        type: "error",
      });
      return;
    }

    const payload: UpdateEmployeePayload = {
      displayName: formData.displayName,
      email: formData.email,
      department: formData.department,
      role: formData.role,
      totalLeave: parseFloat(formData.totalLeave),
      remainingLeave: parseFloat(formData.remainingLeave),
    };

    if (formData.password) {
      if (formData.password.length < 8) {
        AlertService.toast({
          message: "Password must be at least 8 characters",
          type: "error",
        });
        return;
      }
      payload.password = formData.password;
    }

    mutation.mutate(payload);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ChevronLeft size={28} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Employee</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={mutation.isPending}
            style={styles.saveButton}
          >
            {mutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Save size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <User size={48} color={colors.primary} />
            </View>
            <Text style={styles.avatarName}>{employee.displayName}</Text>
            <Text style={styles.avatarDept}>{employee.department}</Text>
          </View>

          <View style={styles.form}>
            <InputField
              label="Full Name"
              value={formData.displayName}
              onChangeText={(text: string) =>
                setFormData({ ...formData, displayName: text })
              }
              icon={User}
            />
            <InputField
              label="Email Address"
              value={formData.email}
              onChangeText={(text: string) =>
                setFormData({ ...formData, email: text })
              }
              icon={Mail}
              keyboardType="email-address"
            />
            <InputField
              label="Department"
              value={formData.department}
              onChangeText={(text: string) =>
                setFormData({ ...formData, department: text })
              }
              icon={Briefcase}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <InputField
                  label="Total Leave"
                  value={formData.totalLeave}
                  onChangeText={(text: string) =>
                    setFormData({ ...formData, totalLeave: text })
                  }
                  icon={Calendar}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <InputField
                  label="Remaining"
                  value={formData.remainingLeave}
                  onChangeText={(text: string) =>
                    setFormData({ ...formData, remainingLeave: text })
                  }
                  icon={Calendar}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.divider} />

            <InputField
              label="Reset Password (leave blank to keep current)"
              value={formData.password}
              onChangeText={(text: string) =>
                setFormData({ ...formData, password: text })
              }
              icon={Lock}
              secureTextEntry
              placeholder="Min 8 characters"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backButton: {
    padding: 4,
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primary,
  },
  scrollContent: {
    padding: 24,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.neutral.light,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarName: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text.main,
  },
  avatarDept: {
    fontSize: 16,
    color: colors.text.muted,
    marginTop: 4,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.main,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.neutral.light,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: colors.text.main,
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 8,
  },
});
