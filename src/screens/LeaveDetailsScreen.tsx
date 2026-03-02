import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLeaveById, cancelLeave } from "../api/leaveApi";
import { colors } from "../theme/colors";
import { format, parseISO } from "date-fns";
import {
  ChevronLeft,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
} from "lucide-react-native";
import { AlertService } from "../components/AlertService";

export default function LeaveDetailsScreen({ route, navigation }: any) {
  const { id } = route.params;
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["leaveDetails", id],
    queryFn: () => getLeaveById(id),
  });

  const mutation = useMutation({
    mutationFn: () => cancelLeave(id),
    onSuccess: () => {
      AlertService.success("Success", "Application cancelled successfully.");
      queryClient.invalidateQueries({ queryKey: ["myLeaves"] });
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      queryClient.invalidateQueries({ queryKey: ["leaveDetails", id] });
      navigation.goBack();
    },
    onError: (err: any) => {
      AlertService.error(err, "Failed to cancel application.");
    },
  });

  const handleCancel = () => {
    AlertService.confirm(
      "Cancel Application",
      "Are you sure you want to withdraw this application? This action cannot be undone.",
      () => mutation.mutate(),
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  if (error || !data?.success) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load details</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backLink}
        >
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const leave = data.data;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return colors.status.approved;
      case "rejected":
        return colors.status.rejected;
      case "pending":
        return colors.status.pending;
      case "cancelled":
        return colors.neutral.base;
      default:
        return colors.neutral.base;
    }
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
        <Text style={styles.headerTitle}>Application Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(leave.status) + "20" },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(leave.status) },
              ]}
            >
              {leave.status.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.categoryTitle}>
            {leave.leaveDetails.category}
          </Text>
          <Text style={styles.appId}>ID: {leave.applicationId}</Text>

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {leave.leaveDetails.totalDaysRequested}
              </Text>
              <Text style={styles.statLabel}>Total Days</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {leave.leaveDetails.paidDaysCount}
              </Text>
              <Text style={styles.statLabel}>Paid</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {leave.leaveDetails.unpaidDaysCount}
              </Text>
              <Text style={styles.statLabel}>Unpaid</Text>
            </View>
          </View>
        </View>

        {/* Timeline Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline & Reasons</Text>
          {leave.timeline.map((item: any, index: number) => (
            <View key={index} style={styles.timelineItem}>
              <View style={styles.timelinePoint} />
              {index !== leave.timeline.length - 1 && (
                <View style={styles.timelineLine} />
              )}

              <View style={styles.timelineContent}>
                <View style={styles.timelineHeader}>
                  <Text style={styles.dateText}>
                    {format(parseISO(item.dateIso), "EEEE, MMM dd, yyyy")}
                  </Text>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>
                      {item.dayType === "full" ? "Full Day" : "Half Day"}
                    </Text>
                  </View>
                </View>

                <View style={styles.reasonContainer}>
                  <View style={styles.reasonHeader}>
                    <AlertCircle size={14} color={colors.secondary} />
                    <Text style={styles.reasonLabel}>
                      {item.reasonCode
                        ? item.reasonCode
                        : "No reason specified"}
                    </Text>
                  </View>
                  {item.comment && (
                    <Text style={styles.commentText}>"{item.comment}"</Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* History / Workflow Section if needed */}
        {leave.approvalWorkflow.history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workflow History</Text>
            {leave.approvalWorkflow.history.map((h: any, i: number) => (
              <View key={i} style={styles.historyRow}>
                <Text style={styles.historyStatus}>
                  {h.status.toUpperCase()}
                </Text>
                <Text style={styles.historyMeta}>
                  By {h.approverRole} •{" "}
                  {format(parseISO(h.timestamp), "MMM dd, HH:mm")}
                </Text>
                {h.message ? (
                  <Text style={styles.historyMsg}>{h.message}</Text>
                ) : null}
              </View>
            ))}
          </View>
        )}

        {leave.status === "pending" && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Trash2 size={20} color="#fff" />
                <Text style={styles.cancelButtonText}>Cancel Application</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 4,
  },
  appId: {
    fontSize: 12,
    color: colors.neutral.base,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    width: "100%",
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.neutral.base,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 16,
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: "row",
    paddingLeft: 20,
    marginBottom: 20,
    minHeight: 60,
  },
  timelinePoint: {
    position: "absolute",
    left: 0,
    top: 6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.secondary,
    zIndex: 2,
    borderWidth: 2,
    borderColor: "#fff",
  },
  timelineLine: {
    position: "absolute",
    left: 5,
    top: 18,
    bottom: -15,
    width: 2,
    backgroundColor: "#E2E8F0",
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  typeBadge: {
    backgroundColor: colors.neutral.light,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: "600",
  },
  reasonContainer: {
    marginTop: 4,
  },
  reasonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  reasonLabel: {
    fontSize: 13,
    color: colors.text.main,
    fontWeight: "500",
  },
  commentText: {
    fontSize: 12,
    color: colors.text.muted,
    fontStyle: "italic",
    marginTop: 2,
  },
  historyRow: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.neutral.base,
  },
  historyStatus: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.primary,
  },
  historyMeta: {
    fontSize: 11,
    color: colors.neutral.base,
    marginTop: 2,
  },
  historyMsg: {
    fontSize: 12,
    color: colors.text.main,
    marginTop: 4,
  },
  cancelButton: {
    backgroundColor: colors.status.rejected,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    color: colors.status.rejected,
    marginBottom: 16,
  },
  backLink: {
    padding: 12,
  },
  backLinkText: {
    color: colors.secondary,
    fontWeight: "600",
  },
});
