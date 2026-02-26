import React, { useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useMutation } from "@tanstack/react-query";
import { CustomCalendar } from "../components/CustomCalendar";
import { AlertService } from "../utils/AlertService";
import {
  DateConfigSheet,
  DateConfig,
  DEFAULT_CONFIG,
} from "../components/DateConfigSheet";
import { applyForLeave } from "../api/leaveApi";
import { colors } from "../theme/colors";
import {
  ChevronLeft,
  Home,
  Calendar as CalendarIcon,
} from "lucide-react-native";
import { useAuth } from "../context/AuthContext";

type RequestType = "leave" | "wfh";

export default function LeaveApplicationScreen({ navigation }: any) {
  const { user } = useAuth();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [requestType, setRequestType] = useState<RequestType>("leave");
  const [selectedDatesMap, setSelectedDatesMap] = useState<
    Record<string, DateConfig>
  >({});
  const [activeDateForConfig, setActiveDateForConfig] = useState<string | null>(
    null,
  );

  // Derive simple array of dates for the calendar
  const selectedDatesArray = useMemo(
    () => Object.keys(selectedDatesMap),
    [selectedDatesMap],
  );

  // Derived calculations for Payload
  const totalDaysRequested = Object.values(selectedDatesMap).reduce(
    (acc, curr) => acc + curr.deductionValue,
    0,
  );
  const paidDaysCount = Object.values(selectedDatesMap)
    .filter((d) => d.isPaid)
    .reduce((acc, curr) => acc + curr.deductionValue, 0);
  const unpaidDaysCount = Object.values(selectedDatesMap)
    .filter((d) => !d.isPaid)
    .reduce((acc, curr) => acc + curr.deductionValue, 0);

  const mutation = useMutation({
    mutationFn: applyForLeave,
    onSuccess: () => {
      AlertService.success(
        "Success",
        `${requestType === "wfh" ? "WFH" : "Leave"} application submitted successfully.`,
      );
      navigation.goBack();
      setSelectedDatesMap({}); // Reset
    },
    onError: (error: any) => {
      AlertService.error(error, "Failed to submit application.");
    },
  });

  const handleDateSelect = (dateIso: string) => {
    setSelectedDatesMap((prev) => {
      const newMap = { ...prev };
      if (newMap[dateIso]) {
        // If already selected, we just open the sheet to edit or remove
        // Alternatively, we could toggle it off here, but let's keep it for now
        // to allow easy access to the config sheet.
      } else {
        // If not selected, add IMMEDIATELY with defaults
        newMap[dateIso] = { ...DEFAULT_CONFIG, dateIso };
      }
      return newMap;
    });

    setActiveDateForConfig(dateIso);
    bottomSheetModalRef.current?.present();
  };

  const handleSaveDateConfig = (config: DateConfig) => {
    setSelectedDatesMap((prev) => ({
      ...prev,
      [config.dateIso]: config,
    }));
    bottomSheetModalRef.current?.dismiss();
  };

  const handleRemoveDate = (dateIso: string) => {
    setSelectedDatesMap((prev) => {
      const clone = { ...prev };
      delete clone[dateIso];
      return clone;
    });
    bottomSheetModalRef.current?.dismiss();
  };

  const handleSubmit = () => {
    if (selectedDatesArray.length === 0) {
      AlertService.error({}, "Please select at least one date.", "Notice");
      return;
    }

    const payload = {
      employeeId: user?.id,
      requestType,
      leaveDetails: {
        category: requestType === "wfh" ? "WFH" : "Casual",
        totalDaysRequested,
        paidDaysCount: requestType === "wfh" ? 0 : paidDaysCount,
        unpaidDaysCount: requestType === "wfh" ? 0 : unpaidDaysCount,
        requestedTimeline: Object.values(selectedDatesMap),
      },
    };

    mutation.mutate(payload);
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
        <Text style={styles.headerTitle}>New Request</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            requestType === "leave" && styles.typeButtonActive,
          ]}
          onPress={() => setRequestType("leave")}
        >
          <CalendarIcon
            size={20}
            color={requestType === "leave" ? "#fff" : colors.primary}
          />
          <Text
            style={[
              styles.typeButtonText,
              requestType === "leave" && styles.typeButtonTextActive,
            ]}
          >
            Leave
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.typeButton,
            requestType === "wfh" && styles.typeButtonActive,
          ]}
          onPress={() => setRequestType("wfh")}
        >
          <Home
            size={20}
            color={requestType === "wfh" ? "#fff" : colors.primary}
          />
          <Text
            style={[
              styles.typeButtonText,
              requestType === "wfh" && styles.typeButtonTextActive,
            ]}
          >
            WFH
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Dates</Text>
          <Text style={styles.sectionSubtitle}>
            Tap a date to add or configure half-days.
          </Text>
          <CustomCalendar
            selectedDates={selectedDatesArray}
            onDateSelect={handleDateSelect}
          />
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            Summary ({requestType.toUpperCase()})
          </Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Days</Text>
            <Text style={styles.summaryValue}>{totalDaysRequested}</Text>
          </View>
          {requestType === "leave" && (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Paid Days</Text>
                <Text style={styles.summaryValue}>{paidDaysCount}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Unpaid Days</Text>
                <Text style={styles.summaryValue}>{unpaidDaysCount}</Text>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              mutation.isPending && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <Text style={styles.submitButtonText}>
                Submit {requestType === "wfh" ? "WFH" : "Leave"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <DateConfigSheet
        ref={bottomSheetModalRef}
        selectedDate={activeDateForConfig}
        initialConfig={
          activeDateForConfig
            ? selectedDatesMap[activeDateForConfig]
            : undefined
        }
        onSave={handleSaveDateConfig}
        onRemove={handleRemoveDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.light,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  typeSelector: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    backgroundColor: "#fff",
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: "#fff",
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
  },
  typeButtonText: {
    fontWeight: "700",
    color: colors.primary,
  },
  typeButtonTextActive: {
    color: "#fff",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.text.muted,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: colors.neutral.background,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.main,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.light,
    paddingBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.text.muted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.primary,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: "bold",
  },
});
