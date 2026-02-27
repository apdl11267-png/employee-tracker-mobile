import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  parseISO,
} from "date-fns";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ChevronRight,
  User as UserIcon,
  Shield,
  Settings,
} from "lucide-react-native";
import { getMyLeaves } from "../api/leaveApi";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";
import { SafeAreaView } from "react-native-safe-area-context";

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <View style={[styles.statCard]}>
    <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
      <Icon size={20} color={color} />
    </View>
    <View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);

export default function HomeScreen({ navigation }: any) {
  const { user, signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);
  };

  const startDate = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const endDate = format(endOfMonth(addMonths(new Date(), 1)), "yyyy-MM-dd");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["leaves", startDate, endDate],
    queryFn: () => getMyLeaves(startDate, endDate),
  });

  const summary = data?.data?.summary;
  const recentLeaves = data?.data?.leaveDetails?.slice(0, 5) || [];
  console.log({ recentLeaves });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return colors.status.approved;
      case "rejected":
        return colors.status.rejected;
      case "cancelled":
        return colors.neutral.base;
      default:
        return colors.status.pending;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <CheckCircle2 size={16} color={colors.status.approved} />;
      case "rejected":
        return <XCircle size={16} color={colors.status.rejected} />;
      case "cancelled":
        return <XCircle size={16} color={colors.neutral.base} />;
      default:
        return <Clock size={16} color={colors.status.pending} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Hello,</Text>
          <Text style={styles.userName}>{user?.displayName || "Employee"}</Text>
          <Text style={styles.userEmail}>{user?.email || "Employee"}</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={handleLogout}>
          <UserIcon size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        <View style={styles.statsGrid}>
          <StatCard
            label="Remaining"
            value={summary?.totalRemainingLeaves ?? "-"}
            icon={Calendar}
            color={colors.secondary}
          />
          <StatCard
            label="Requested"
            value={summary?.totalLeaveRequested ?? "-"}
            icon={Clock}
            color={colors.status.pending}
          />
          <StatCard
            label="Taken Today"
            value={summary?.totalLeavesTaken ?? "-"}
            icon={CheckCircle2}
            color={colors.status.approved}
          />
        </View>

        {user?.role !== "EMPLOYEE" && (
          <View style={styles.adminSection}>
            <Text style={styles.sectionTitle}>Admin Panel</Text>
            <View style={styles.adminGrid}>
              <TouchableOpacity
                style={styles.adminCard}
                onPress={() => navigation.navigate("AdminDashboard")}
              >
                <Shield size={24} color={colors.primary} />
                <Text style={styles.adminCardText}>Manage Leaves</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.adminCard}
                onPress={() => navigation.navigate("EmployeeList")}
              >
                <UserIcon size={24} color={colors.primary} />
                <Text style={styles.adminCardText}>Manage Employees</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.adminCard}
                onPress={() => navigation.navigate("CreateEmployee")}
              >
                <Plus size={24} color={colors.primary} />
                <Text style={styles.adminCardText}>Create Employee</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Leave/WFH ({format(new Date(), "MMMM")}-
            {format(addMonths(new Date(), 1), "MMMM")})
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("LeaveHistory")}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <Text style={styles.loadingText}>Loading requests...</Text>
        ) : recentLeaves.length > 0 ? (
          recentLeaves.map((leave: any) => {
            const firstDate = leave.timeline?.[0]?.dateIso;
            const lastDate =
              leave.timeline?.[leave.timeline.length - 1]?.dateIso;
            const dateRange =
              leave.timeline.length > 1
                ? `${format(parseISO(firstDate), "MMM dd")} - ${format(parseISO(lastDate), "MMM dd")}`
                : format(parseISO(firstDate), "MMM dd, yyyy");

            return (
              <TouchableOpacity
                key={leave._id}
                style={styles.leaveItem}
                onPress={() =>
                  navigation.navigate("LeaveDetails", { id: leave._id })
                }
              >
                <View style={styles.leaveInfo}>
                  <Text style={styles.leaveDate}>{dateRange}</Text>
                  <Text style={styles.leaveType}>
                    {leave.leaveDetails.category} •{" "}
                    {leave.leaveDetails.totalDaysRequested} Days
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  {getStatusIcon(leave.status)}
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(leave.status) },
                    ]}
                  >
                    {leave.status.charAt(0).toUpperCase() +
                      leave.status.slice(1)}
                  </Text>
                  <ChevronRight size={16} color={colors.neutral.base} />
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No data for this/next month</Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("ApplyLeave")}
      >
        <Plus color="#fff" size={24} />
        <Text style={styles.fabText}>Apply Leave/WFH</Text>
      </TouchableOpacity>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.text.muted,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text.main,
  },
  userEmail: {
    fontSize: 12,
    fontWeight: "400",
    color: colors.text.muted,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  statCard: {
    width: "31%",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
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
    fontSize: 10,
    color: colors.text.muted,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.main,
  },
  seeAll: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: "600",
  },
  leaveItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
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
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    marginRight: 4,
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    marginLeft: 8,
  },
  loadingText: {
    textAlign: "center",
    color: colors.text.muted,
    marginTop: 20,
  },
  emptyState: {
    padding: 40,
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
  adminSection: {
    marginBottom: 24,
  },
  adminGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  adminCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  adminCardText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text.main,
    textAlign: "center",
  },
});
