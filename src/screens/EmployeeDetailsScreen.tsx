import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { employeeApi, EmployeeData } from "../api/employeeApi";
import { colors } from "../theme/colors";
import { format, parseISO } from "date-fns";
import {
  ChevronLeft,
  User,
  Mail,
  Briefcase,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Edit2,
  History,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EmployeeDetailsScreen({ route, navigation }: any) {
  const { employee } = route.params as { employee: EmployeeData };

  const { data: leavesData, isLoading } = useQuery({
    queryKey: ["employeeLeaves", employee._id],
    queryFn: () => employeeApi.getEmployeeLeaves(employee._id),
  });

  const { data: logsData, isLoading: isLoadingLogs } = useQuery({
    queryKey: ["employeeLogs", employee._id],
    queryFn: () => employeeApi.getEmployeeLogs(employee._id),
  });

  const leaves = leavesData?.data?.leaveDetails || [];
  const summary = leavesData?.data?.summary;
  const logs = logsData?.data || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return colors.status.approved;
      case "rejected":
        return colors.status.rejected;
      default:
        return colors.status.pending;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 size={16} color={colors.status.approved} />;
      case "rejected":
        return <XCircle size={16} color={colors.status.rejected} />;
      default:
        return <Clock size={16} color={colors.status.pending} />;
    }
  };

  const renderLeaveItem = ({ item }: { item: any }) => {
    const firstDate = item.timeline?.[0]?.dateIso;
    const lastDate = item.timeline?.[item.timeline.length - 1]?.dateIso;
    const dateRange =
      item.timeline.length > 1
        ? `${format(parseISO(firstDate), "MMM dd")} - ${format(parseISO(lastDate), "MMM dd")}`
        : format(parseISO(firstDate), "MMM dd, yyyy");

    return (
      <View style={styles.leaveItem}>
        <View style={styles.leaveInfo}>
          <Text style={styles.leaveDate}>{dateRange}</Text>
          <Text style={styles.leaveType}>
            {item.leaveDetails.category} •{" "}
            {item.leaveDetails.totalDaysRequested} Days
          </Text>
        </View>
        <View style={styles.statusBadge}>
          {getStatusIcon(item.status)}
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
    );
  };

  const renderLogItem = ({ item }: { item: any }) => (
    <View style={styles.logItem}>
      <View style={styles.logHeader}>
        <Text style={styles.logAdmin}>
          {item.updatedBy?.displayName || "Admin"} updated
        </Text>
        <Text style={styles.logDate}>
          {format(new Date(item.createdAt), "MMM dd, HH:mm")}
        </Text>
      </View>
      <View style={styles.logChanges}>
        {item.changes.map((change: any, index: number) => (
          <View key={index} style={styles.changeItem}>
            <Text style={styles.fieldName}>
              {change.field.charAt(0).toUpperCase() + change.field.slice(1)}:
            </Text>
            <View style={styles.changeValues}>
              <Text style={styles.oldValue}>{String(change.oldValue)}</Text>
              <ChevronLeft
                size={12}
                color={colors.text.muted}
                style={{ transform: [{ rotate: "180deg" }] }}
              />
              <Text style={styles.newValue}>{String(change.newValue)}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Details</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("EditEmployee", { employee })}
          style={styles.editButton}
        >
          <Edit2 size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <User size={48} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.userName}>{employee.displayName}</Text>
              <Text style={styles.userRole}>{employee.role}</Text>
            </View>
          </View>

          <View style={styles.basicInfo}>
            <View style={styles.infoRow}>
              <Mail size={18} color={colors.text.muted} />
              <Text style={styles.infoText}>{employee.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Briefcase size={18} color={colors.text.muted} />
              <Text style={styles.infoText}>{employee.department}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Leave Summary (Current Year)</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: `${colors.secondary}15` },
              ]}
            >
              <Calendar size={20} color={colors.secondary} />
            </View>
            <Text style={styles.statValue}>
              {summary?.totalRemainingLeaves ?? employee.remainingLeave}
            </Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </View>
          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: `${colors.status.pending}15` },
              ]}
            >
              <Clock size={20} color={colors.status.pending} />
            </View>
            <Text style={styles.statValue}>
              {summary?.totalLeaveRequested ?? 0}
            </Text>
            <Text style={styles.statLabel}>Requested</Text>
          </View>
          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: `${colors.status.approved}15` },
              ]}
            >
              <CheckCircle2 size={20} color={colors.status.approved} />
            </View>
            <Text style={styles.statValue}>
              {summary?.totalLeavesTaken ?? 0}
            </Text>
            <Text style={styles.statLabel}>Taken</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Leave History</Text>
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
        ) : leaves.length > 0 ? (
          leaves.map((leave: any) => (
            <View key={leave._id}>{renderLeaveItem({ item: leave })}</View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No leave records found for this year.
            </Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Update History</Text>
          <History size={18} color={colors.text.muted} />
        </View>
        {isLoadingLogs ? (
          <ActivityIndicator
            style={{ marginVertical: 20 }}
            color={colors.primary}
          />
        ) : logs.length > 0 ? (
          logs.map((log: any) => (
            <View key={log._id}>{renderLogItem({ item: log })}</View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No update logs found.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
    paddingVertical: 12,
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
  editButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.neutral.light,
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text.main,
  },
  userRole: {
    fontSize: 16,
    color: colors.text.muted,
    fontWeight: "600",
  },
  basicInfo: {
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.light,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    fontSize: 15,
    color: colors.text.main,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.main,
    marginBottom: 16,
    marginTop: 12,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.main,
  },
  statLabel: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 2,
  },
  leaveItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  leaveInfo: {
    flex: 1,
  },
  leaveDate: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.main,
  },
  leaveType: {
    fontSize: 13,
    color: colors.text.muted,
    marginTop: 2,
  },
  leaveReason: {
    fontSize: 12,
    color: colors.text.muted,
    fontStyle: "italic",
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyState: {
    padding: 30,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: colors.neutral.base,
  },
  emptyText: {
    color: colors.text.muted,
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  logItem: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.status.pending,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  logAdmin: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text.main,
  },
  logDate: {
    fontSize: 12,
    color: colors.text.muted,
  },
  logChanges: {
    gap: 8,
  },
  changeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  fieldName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.muted,
    minWidth: 80,
  },
  changeValues: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  oldValue: {
    fontSize: 13,
    color: colors.status.rejected,
    textDecorationLine: "line-through",
  },
  newValue: {
    fontSize: 13,
    color: colors.status.approved,
    fontWeight: "600",
  },
});
