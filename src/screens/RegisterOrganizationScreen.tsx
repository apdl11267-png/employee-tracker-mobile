import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useTenant } from "../context/TenantContext";
import { colors } from "../theme/colors";
import { Building2, Plus, ArrowLeft } from "lucide-react-native";
import { tenantCreate } from "../api/tenantApi";
import { CustomCalendar } from "../components/CustomCalendar";

const RegisterOrganizationScreen = ({ navigation }: any) => {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setTenant } = useTenant();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date(new Date().getFullYear(), 0, 1).toLocaleDateString("en-CA"),
  );
  const selectedDatesArray = useMemo(() => [selectedDate], [selectedDate]);

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    if (slug.trim().length < 2) {
      setError("Slug must be at least 2 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tenantData = await tenantCreate(name, slug, selectedDate);

      await setTenant({
        id: tenantData.id,
        name: tenantData.name,
        slug: tenantData.slug,
        themeConfig: tenantData.themeConfig,
        statsResetDate: new Date(tenantData.statsResetDate),
      });

      // Navigation will be handled by the navigator
    } catch (err: any) {
      console.error("Create Org Error:", err);
      setError(
        err.response?.data?.error ||
          "Failed to create organization. Slug might be taken.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (dateIso: string) => {
    setSelectedDate(dateIso);
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={colors.text.main} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Building2 size={40} color={colors.primary} />
              <Plus
                size={20}
                color={colors.secondary}
                style={styles.plusIcon}
              />
            </View>
            <Text style={styles.title}>New Organization</Text>
            <Text style={styles.subtitle}>
              Register your organization to start tracking your employees
              leaves/WFH
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Organization Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Acme Corp"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setError(null);
                }}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Organization Slug</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. acme-corp"
                value={slug}
                onChangeText={(text) => {
                  setSlug(text.toLowerCase().replace(/\s+/g, "-"));
                  setError(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.helpText}>
                This will be used for your organization's unique URL/Discovery
              </Text>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <View>
              <Text style={styles.label}>Stats Reset Date</Text>
              <Text style={styles.helpText}>
                (Leave/Stats will be reset on this date. Recommended date is Jan
                1st to reset the Employees's leaves in Jan 1.)
              </Text>
              <CustomCalendar
                selectedDates={selectedDatesArray}
                onDateSelect={handleDateSelect}
                defaultDate={new Date(new Date().getFullYear(), 0, 1)}
                showTitle={["month"]}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.text.inverse} />
              ) : (
                <Text style={styles.buttonText}>Register Organization</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  backButton: {
    marginBottom: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconContainer: {
    position: "relative",
    marginBottom: 16,
  },
  plusIcon: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: colors.neutral.background,
    borderRadius: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text.main,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.muted,
    marginTop: 8,
    textAlign: "center",
  },
  form: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.main,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.neutral.light,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    height: 56,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text.main,
  },
  helpText: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 4,
  },
  errorText: {
    color: colors.status.rejected,
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.text.inverse,
    fontSize: 18,
    fontWeight: "600",
  },
});

export default RegisterOrganizationScreen;
