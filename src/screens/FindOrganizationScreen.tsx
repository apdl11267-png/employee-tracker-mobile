import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useTenant } from "../context/TenantContext";
import apiClient from "../api/apiClient";
import { colors } from "../theme/colors";
import { Search, Building2, ArrowRight } from "lucide-react-native";

const FindOrganizationScreen = ({ navigation }: any) => {
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setTenant } = useTenant();

  const handleFind = async () => {
    if (!slug.trim()) {
      setError("Please enter an organization slug");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(
        `/tenants/search?slug=${slug.toLowerCase().trim()}`,
      );
      const tenantData = response.data.data;

      await setTenant({
        id: tenantData.id,
        name: tenantData.name,
        slug: tenantData.slug,
        themeConfig: tenantData.themeConfig,
      });

      // Navigation will be handled by the navigator based on context state
    } catch (err: any) {
      console.error("Find Org Error:", err);
      setError(
        err.response?.data?.error ||
          "Organization not found. Please check the slug.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        <View style={styles.header}>
          <Building2 size={64} color={colors.primary} />
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>
            Enter your organization's slug to continue
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Search
              size={20}
              color={colors.neutral.base}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="organization-slug"
              value={slug}
              onChangeText={(text) => {
                setSlug(text);
                setError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleFind}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <>
                <Text style={styles.buttonText}>Continue</Text>
                <ArrowRight size={20} color={colors.text.inverse} />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate("RegisterOrganization")}
          >
            <Text style={styles.registerText}>
              Don't have an organization?{" "}
              <Text style={styles.registerHighlight}>Create one</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.text.main,
    marginTop: 16,
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.neutral.light,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: colors.text.main,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.text.inverse,
    fontSize: 18,
    fontWeight: "600",
    marginRight: 8,
  },
  registerLink: {
    marginTop: 24,
    alignItems: "center",
  },
  registerText: {
    fontSize: 14,
    color: colors.text.muted,
  },
  registerHighlight: {
    color: colors.secondary,
    fontWeight: "600",
  },
});

export default FindOrganizationScreen;
