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
import { BottomSheetModal, BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { colors } from "../theme/colors";

export interface DateConfig {
  dateIso: string;
  dayType: "full" | "half_morning" | "half_afternoon";
  deductionValue: number;
  isPaid: boolean;
  reasonCode: string;
  comment: string;
}

interface DateConfigSheetProps {
  selectedDate: string | null;
  onSave: (config: DateConfig) => void;
  onRemove: (dateIso: string) => void;
  initialConfig?: DateConfig;
}

export const DEFAULT_CONFIG: Omit<DateConfig, "dateIso"> = {
  dayType: "full",
  deductionValue: 1.0,
  isPaid: true,
  reasonCode: "Personal_Leave",
  comment: "",
};

export const DateConfigSheet = forwardRef<
  BottomSheetModal,
  DateConfigSheetProps
>(({ selectedDate, onSave, onRemove, initialConfig }, ref) => {
  const snapPoints = useMemo(() => ["65%"], []);

  const [config, setConfig] = useState<Omit<DateConfig, "dateIso">>({
    ...DEFAULT_CONFIG,
  });

  // Sync when bottom sheet opens/changes date
  useEffect(() => {
    console.log({ selectedDate, initialConfig });
    if (initialConfig) {
      setConfig({
        dayType: initialConfig.dayType,
        deductionValue: initialConfig.deductionValue,
        isPaid: initialConfig.isPaid,
        reasonCode: initialConfig.reasonCode,
        comment: initialConfig.comment,
      });
    } else {
      setConfig({ ...DEFAULT_CONFIG });
    }
  }, [selectedDate, initialConfig]);

  const handleSave = () => {
    if (selectedDate) {
      onSave({ ...config, dateIso: selectedDate });
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
    >
      <View style={styles.container}>
        <Text style={styles.title}>Configure: {selectedDate}</Text>

        <Text style={styles.label}>Day Type</Text>
        <View style={styles.row}>
          {(["full", "half_morning", "half_afternoon"] as const).map((type) => (
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
          ))}
        </View>

        <Text style={styles.label}>Paid / Unpaid</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.pill, config.isPaid && styles.pillActive]}
            onPress={() => setConfig((prev) => ({ ...prev, isPaid: true }))}
          >
            <Text
              style={[styles.pillText, config.isPaid && styles.pillTextActive]}
            >
              PAID
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pill, !config.isPaid && styles.pillActive]}
            onPress={() => setConfig((prev) => ({ ...prev, isPaid: false }))}
          >
            <Text
              style={[styles.pillText, !config.isPaid && styles.pillTextActive]}
            >
              UNPAID
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Reason Code</Text>
        <TextInput
          style={styles.input}
          value={config.reasonCode}
          onChangeText={(v) =>
            setConfig((prev) => ({ ...prev, reasonCode: v }))
          }
        />

        <Text style={styles.label}>Comment</Text>
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
          <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
            <Text style={styles.actionButtonText}>Save Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheetModal>
  );
});

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
  removeBtn: {
    backgroundColor: colors.status.rejected,
  },
  actionButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: "600",
  },
});
