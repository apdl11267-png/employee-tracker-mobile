import React, {
  forwardRef,
  useCallback,
  useMemo,
  useState,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { colors } from "../theme/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertService } from "./AlertService";

export interface DateConfig {
  dateIso: string;
  dayType: "full" | "half_morning" | "half_afternoon";
  deductionValue: number;
  isPaid: boolean;
  reasonCode: string;
  comment: string;
}

interface DateConfigSheetProps {
  submitBtnRef: React.RefObject<any>;
  selectedDate: string | null;
  requestType: "leave" | "wfh";
  onSave: (config: DateConfig) => void;
  onRemove: (dateIso: string) => void;
  initialConfig?: DateConfig;
}

export const DEFAULT_CONFIG: Omit<DateConfig, "dateIso"> = {
  dayType: "full",
  deductionValue: 1.0,
  isPaid: true,
  reasonCode: "",
  comment: "",
};

const LEAVE_CATEGORIES = [
  { label: "Sick Leave", value: "Sick Leave" },
  { label: "Casual PTO", value: "Casual PTO Leave" },
  { label: "Vacation", value: "Vacation Leave" },
  { label: "Festival/Holiday", value: "Festival/Holiday Leave" },
  { label: "Personal Leave", value: "Personal Leave" },
];

const WFH_CATEGORIES = [
  { label: "Personal Work", value: "Personal Work" },
  { label: "Commute Issue", value: "Commute Issue" },
  { label: "Not Well", value: "Not Well" },
  { label: "Other", value: "Other" },
];

export const DateConfigSheet = forwardRef<
  BottomSheetModal,
  DateConfigSheetProps
>(
  (
    {
      submitBtnRef,
      selectedDate,
      requestType,
      onSave,
      onRemove,
      initialConfig,
    },
    ref,
  ) => {
    const snapPoints = useMemo(() => ["80%"], []);
    const insets = useSafeAreaInsets();
    const [config, setConfig] = useState<Omit<DateConfig, "dateIso">>({
      ...DEFAULT_CONFIG,
    });

    // Sync when bottom sheet opens/changes date
    useEffect(() => {
      if (initialConfig) {
        setConfig({
          dayType: initialConfig.dayType,
          deductionValue: initialConfig.deductionValue,
          isPaid: initialConfig.isPaid,
          reasonCode: initialConfig.reasonCode || "",
          comment: initialConfig.comment || "",
        });
      } else {
        // For a new date selection
        setConfig({
          ...DEFAULT_CONFIG,
          reasonCode: "", // Force selection
        });
      }
    }, [selectedDate, initialConfig, requestType]);

    const handleSave = () => {
      if (selectedDate) {
        onSave({ ...config, dateIso: selectedDate });
        AlertService.toast({
          message: "You can add more dates, then click Submit",
          type: "info",
          timeout: 3000,
        });

        // 3. Scroll to the button
        setTimeout(() => {
          submitBtnRef.current?.scrollToEnd({ animated: true });
        }, 0);
      }
    };

    const handleRemove = () => {
      if (selectedDate) onRemove(selectedDate);
    };

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
        />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        enablePanDownToClose={true}
        keyboardBehavior="extend"
      >
        <BottomSheetView
          style={{ ...styles.container, paddingBottom: insets.bottom + 24 }}
        >
          <Text style={styles.title}>Configure: {selectedDate}</Text>

          <Text style={styles.label}>Reason / Category (Required)</Text>
          <View style={[styles.row, { flexWrap: "wrap" }]}>
            {(requestType === "leave" ? LEAVE_CATEGORIES : WFH_CATEGORIES).map(
              (cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.pill,
                    config.reasonCode === cat.value && styles.pillActive,
                  ]}
                  onPress={() =>
                    setConfig((prev) => ({ ...prev, reasonCode: cat.value }))
                  }
                >
                  <Text
                    style={[
                      styles.pillText,
                      config.reasonCode === cat.value && styles.pillTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </View>

          <Text style={styles.label}>Day Type</Text>
          <View style={styles.row}>
            {(["full", "half_morning", "half_afternoon"] as const).map(
              (type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.pill,
                    config.dayType === type && styles.pillActive,
                  ]}
                  onPress={() =>
                    setConfig((prev) => ({
                      ...prev,
                      dayType: type,
                      deductionValue: type === "full" ? 1.0 : 0.5,
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.pillText,
                      config.dayType === type && styles.pillTextActive,
                    ]}
                  >
                    {type.replace("_", " ").toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </View>

          <Text style={styles.label}>Paid / Unpaid</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.pill, config.isPaid && styles.pillActive]}
              onPress={() => setConfig((prev) => ({ ...prev, isPaid: true }))}
            >
              <Text
                style={[
                  styles.pillText,
                  config.isPaid && styles.pillTextActive,
                ]}
              >
                PAID
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pill, !config.isPaid && styles.pillActive]}
              onPress={() => setConfig((prev) => ({ ...prev, isPaid: false }))}
            >
              <Text
                style={[
                  styles.pillText,
                  !config.isPaid && styles.pillTextActive,
                ]}
              >
                UNPAID
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Comment (Optional)</Text>
          <TextInput
            style={styles.input}
            value={config.comment}
            onChangeText={(v) => setConfig((prev) => ({ ...prev, comment: v }))}
            placeholder="Optional comment..."
          />

          <View style={styles.footerRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.removeBtn]}
              onPress={handleRemove}
            >
              <Text style={styles.actionButtonText}>Remove Day</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                !config.reasonCode && styles.actionButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={!config.reasonCode}
            >
              <Text style={styles.actionButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.neutral.light,
    borderRadius: 24,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text.main,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: colors.text.muted,
    marginBottom: 8,
    marginTop: 12,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: colors.neutral.background,
    borderWidth: 1,
    borderColor: colors.neutral.base,
  },
  pillActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  pillText: {
    fontSize: 12,
    color: colors.text.main,
    fontWeight: "500",
  },
  pillTextActive: {
    color: colors.text.inverse,
  },
  input: {
    backgroundColor: colors.neutral.background,
    borderWidth: 1,
    borderColor: colors.neutral.base,
    borderRadius: 8,
    padding: 12,
    color: colors.text.main,
  },
  footerRow: {
    flexDirection: "row",
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  actionButtonDisabled: {
    backgroundColor: colors.neutral.base,
    opacity: 0.5,
  },
  removeBtn: {
    backgroundColor: colors.status.rejected,
  },
  actionButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: "600",
  },
});
