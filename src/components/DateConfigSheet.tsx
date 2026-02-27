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
  ActivityIndicator,
  Dimensions,
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import Animated, { Layout, FadeIn } from "react-native-reanimated";
import { colors } from "../theme/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Trash2,
} from "lucide-react-native";
import { format, parseISO } from "date-fns";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

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
  selectedDatesMap: Record<string, DateConfig>;
  requestType: "leave" | "wfh";
  onSave: (configs: Record<string, DateConfig>) => void;
  onSubmit: (finalTimeline: DateConfig[]) => void;
  onRemove: (dateIso: string) => void;
  isSubmitting?: boolean;
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
    { selectedDatesMap, requestType, onSubmit, onRemove, isSubmitting = false },
    ref,
  ) => {
    const snapPoints = useMemo(() => ["94%"], []);
    const insets = useSafeAreaInsets();

    // Calculate maximum height available for the content inside the 94% snap point
    const modalHeight = SCREEN_HEIGHT * 0.94;
    const footerHeight = 85 + insets.bottom;

    const [localConfigs, setLocalConfigs] = useState<
      Record<string, DateConfig>
    >({});
    const [globalConfig, setGlobalConfig] = useState<
      Omit<DateConfig, "dateIso">
    >({ ...DEFAULT_CONFIG });
    const [expandedDate, setExpandedDate] = useState<string | null>(null);

    useEffect(() => {
      setLocalConfigs(selectedDatesMap);
    }, [selectedDatesMap]);

    const totalDays = useMemo(() => {
      return Object.values(localConfigs).reduce(
        (acc, curr) => acc + curr.deductionValue,
        0,
      );
    }, [localConfigs]);

    const isFormValid = useMemo(() => {
      const configs = Object.values(localConfigs);
      if (configs.length === 0) return false;
      return configs.every((c) => c.reasonCode && c.reasonCode.length > 0);
    }, [localConfigs]);

    const handleGlobalUpdate = (
      updates: Partial<Omit<DateConfig, "dateIso">>,
    ) => {
      const newGlobal = { ...globalConfig, ...updates };
      setGlobalConfig(newGlobal);
      const newLocalConfigs = { ...localConfigs };
      Object.keys(newLocalConfigs).forEach((date) => {
        newLocalConfigs[date] = { ...newLocalConfigs[date], ...updates };
      });
      setLocalConfigs(newLocalConfigs);
    };

    const handleLocalUpdate = (date: string, updates: Partial<DateConfig>) => {
      setLocalConfigs((prev) => ({
        ...prev,
        [date]: { ...prev[date], ...updates },
      }));
    };

    const handleSubmit = () => {
      if (!isFormValid) return;
      onSubmit(Object.values(localConfigs));
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

    const categories =
      requestType === "leave" ? LEAVE_CATEGORIES : WFH_CATEGORIES;

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        enablePanDownToClose={true}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
      >
        {/* We use a container with a fixed height based on the snap point */}
        <View style={[styles.outerContainer, { height: modalHeight - 40 }]}>
          {/* HEADER TITLE */}
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>Configure Application</Text>
          </View>

          {/* This ScrollView contains EVERYTHING except the button footer */}
          <BottomSheetScrollView
            showsVerticalScrollIndicator={true}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: footerHeight + 20 },
            ]}
          >
            {/* GLOBAL CONFIG */}
            <View style={styles.globalSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Apply to All Days</Text>
                <Text style={styles.sectionSubtitle}>
                  Quickly set same reason for all selected dates
                </Text>
              </View>

              <Text style={styles.label}>Reason / Category</Text>
              <View style={styles.rowWrapper}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.pill,
                      globalConfig.reasonCode === cat.value &&
                        styles.pillActive,
                    ]}
                    onPress={() =>
                      handleGlobalUpdate({ reasonCode: cat.value })
                    }
                  >
                    <Text
                      style={[
                        styles.pillText,
                        globalConfig.reasonCode === cat.value &&
                          styles.pillTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.dualColumn}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Day Type</Text>
                  <View style={styles.row}>
                    {["full", "half_morning", "half_afternoon"].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.smallPill,
                          globalConfig.dayType === type && styles.pillActive,
                        ]}
                        onPress={() =>
                          handleGlobalUpdate({
                            dayType: type as any,
                            deductionValue: type === "full" ? 1.0 : 0.5,
                          })
                        }
                      >
                        <Text
                          style={[
                            styles.pillText,
                            globalConfig.dayType === type &&
                              styles.pillTextActive,
                          ]}
                        >
                          {type === "full"
                            ? "FULL"
                            : type.split("_")[1].toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={{ flex: 0.4 }}>
                  <Text style={styles.label}>Payment</Text>
                  <View style={styles.row}>
                    <TouchableOpacity
                      style={[
                        styles.smallPill,
                        globalConfig.isPaid && styles.pillActive,
                      ]}
                      onPress={() => handleGlobalUpdate({ isPaid: true })}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          globalConfig.isPaid && styles.pillTextActive,
                        ]}
                      >
                        PAID
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.smallPill,
                        !globalConfig.isPaid && styles.pillActive,
                      ]}
                      onPress={() => handleGlobalUpdate({ isPaid: false })}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          !globalConfig.isPaid && styles.pillTextActive,
                        ]}
                      >
                        UnPaid
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* TIMELINE DETAILS */}
            <View style={styles.timelineSection}>
              <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>
                Timeline Details ({Object.keys(localConfigs).length} Days)
              </Text>

              {Object.keys(localConfigs)
                .sort()
                .map((dateIso) => {
                  const config = localConfigs[dateIso];
                  const isExpanded = expandedDate === dateIso;
                  const dateObj = parseISO(dateIso);

                  return (
                    <Animated.View
                      key={dateIso}
                      layout={Layout.duration(200)}
                      style={styles.accordionItem}
                    >
                      <TouchableOpacity
                        style={styles.accordionHeader}
                        onPress={() =>
                          setExpandedDate(isExpanded ? null : dateIso)
                        }
                      >
                        <View style={styles.dateInfo}>
                          <View style={styles.calendarDot} />
                          <View>
                            <Text style={styles.dateMainText}>
                              {format(dateObj, "EEEE, MMM dd")}
                            </Text>
                            <Text style={styles.dateSubText}>
                              {config.reasonCode || "No Reason Selected"} •{" "}
                              {config.dayType.replace("_", " ")}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.headerRight}>
                          {!config.reasonCode && (
                            <AlertCircle
                              size={16}
                              color={colors.status.rejected}
                              style={{ marginRight: 8 }}
                            />
                          )}
                          {isExpanded ? (
                            <ChevronUp size={20} color="#666" />
                          ) : (
                            <ChevronDown size={20} color="#666" />
                          )}
                        </View>
                      </TouchableOpacity>

                      {isExpanded && (
                        <Animated.View
                          entering={FadeIn}
                          style={styles.accordionContent}
                        >
                          <Text style={styles.label}>Reason for this day</Text>
                          <View style={styles.rowWrapper}>
                            {categories.map((cat) => (
                              <TouchableOpacity
                                key={cat.value}
                                style={[
                                  styles.pill,
                                  config.reasonCode === cat.value &&
                                    styles.pillActive,
                                ]}
                                onPress={() =>
                                  handleLocalUpdate(dateIso, {
                                    reasonCode: cat.value,
                                  })
                                }
                              >
                                <Text
                                  style={[
                                    styles.pillText,
                                    config.reasonCode === cat.value &&
                                      styles.pillTextActive,
                                  ]}
                                >
                                  {cat.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>

                          <Text style={styles.label}>Comment</Text>
                          <TextInput
                            style={styles.input}
                            value={config.comment}
                            onChangeText={(v) =>
                              handleLocalUpdate(dateIso, { comment: v })
                            }
                            placeholder="Optional comment..."
                          />

                          <TouchableOpacity
                            style={styles.removeDayBtn}
                            onPress={() => onRemove(dateIso)}
                          >
                            <Trash2 size={14} color={colors.status.rejected} />
                            <Text style={styles.removeDayText}>
                              Remove Date
                            </Text>
                          </TouchableOpacity>
                        </Animated.View>
                      )}
                    </Animated.View>
                  );
                })}
            </View>
          </BottomSheetScrollView>

          {/* FIXED FOOTER - Absolutely positioned at the bottom of the outerContainer */}
          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!isFormValid || isSubmitting) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isFormValid
                    ? `Submit ${totalDays} Day${totalDays > 1 ? "s" : ""}`
                    : "Select Reasons to Enable"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  sheetBackground: { backgroundColor: colors.neutral.light, borderRadius: 32 },
  outerContainer: {
    width: "100%",
    position: "relative",
  },
  headerTitleContainer: {
    backgroundColor: colors.neutral.light,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    zIndex: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
    paddingVertical: 16,
  },
  globalSection: {
    padding: 20,
    paddingBottom: 15,
  },
  divider: { height: 8, backgroundColor: "#F1F5F9" },
  scrollContent: {
    // This allows the scroll content to scroll underneath the fixed footer
  },
  timelineSection: {
    padding: 20,
  },
  footer: {
    position: "absolute",
    bottom: -20,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  // UI Elements
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.primary },
  sectionSubtitle: { fontSize: 12, color: colors.text.muted },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.muted,
    marginBottom: 8,
    marginTop: 12,
  },
  row: { flexDirection: "row", gap: 8 },
  dualColumn: { flexDirection: "column", gap: 16 },
  rowWrapper: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  smallPill: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  pillActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  pillText: { fontSize: 11, color: colors.text.main, fontWeight: "600" },
  pillTextActive: { color: "#fff" },
  accordionItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  accordionHeader: {
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  calendarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
  },
  dateMainText: { fontSize: 14, fontWeight: "700", color: colors.primary },
  dateSubText: { fontSize: 11, color: colors.text.muted },
  headerRight: { flexDirection: "row", alignItems: "center" },
  accordionContent: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#F8FAFC",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: colors.text.main,
    marginTop: 4,
  },
  removeDayBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  removeDayText: {
    fontSize: 12,
    color: colors.status.rejected,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonDisabled: { backgroundColor: colors.neutral.base, opacity: 0.5 },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
