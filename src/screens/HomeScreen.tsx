import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, addDays, parseISO } from "date-fns";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ChevronRight,
  User as UserIcon,
  Shield,
  Users,
  Briefcase,
  Monitor,
  LogOut,
  MessageCircle,
} from "lucide-react-native";
import { getPeersLeaves, getMySummary } from "../api/leaveApi";
import { getAdminStats, downloadAdminReport } from "../api/adminApi";
import { useUnreadChatCount } from "../api/chatApi";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { colors } from "../theme/colors";
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Download } from "lucide-react-native";
import { AlertService } from "../components/AlertService";

// ─── Types ───────────────────────────────────────────────────────────────────

type DateWindow = "today" | "3d" | "7d" | "30d" | "60d";

interface DateWindowOption {
  key: DateWindow;
  label: string;
  days: number;
}

const DATE_WINDOWS: DateWindowOption[] = [
  { key: "today", label: "Today", days: 0 },
  { key: "7d", label: "7 Days", days: 7 },
  { key: "30d", label: "30 Days", days: 30 },
  { key: "60d", label: "60 Days", days: 60 },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon: Icon, color, onPress }: any) => (
  <TouchableOpacity
    style={[styles.statCard]}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
      <Icon size={20} color={color} />
    </View>
    <View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </TouchableOpacity>
);

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedWindow, setSelectedWindow] = useState<DateWindow>("7d");

  const { data: unreadData } = useUnreadChatCount();
  const unreadCount = unreadData?.unreadCount ?? 0;

  // Socket listener for new messages to update badge
  useEffect(() => {
    if (socket) {
      socket.on("new_message", () => {
        // Invalidate unread count to trigger a fresh fetch
        queryClient.invalidateQueries({ queryKey: ["unreadChatCount"] });
      });

      // ── Notification System implementation ──

      // 1. For Admin: New leave request
      socket.on("new_leave_request_targeted", (data) => {
        if (data.roles.includes(user?.role)) {
          AlertService.toast({
            message: `New ${data.requestType} requested by ${data.employeeName}`,
            type: "info",
            timeout: 4000,
          });
          queryClient.invalidateQueries({ queryKey: ["adminStats"] });
        }
      });

      // 2. For Employee: Leave approved/rejected
      socket.on(`leave_status_update_${user?.id}`, (data) => {
        const type = data.status === "approved" ? "success" : "error";
        AlertService.toast({
          message: `Your ${data.requestType} request was ${data.status}${data.message ? ": " + data.message : ""}`,
          type,
          timeout: 5000,
        });
        queryClient.invalidateQueries({ queryKey: ["summary"] });
        queryClient.invalidateQueries({ queryKey: ["myLeaves"] });
      });

      // 3. For Peers: When someone's leave is approved
      socket.on("peer_leave_approved", (data) => {
        // Don't toast for self (handled by status update)
        if (data.employeeId !== user?.id) {
          // Just refresh the peer feed, maybe not toast every single one to avoid spam
          // but if we want "wow", a subtle toast helps.
          queryClient.invalidateQueries({ queryKey: ["peersLeaves"] });
        }
      });

      // 4. Admin: Leave cancelled (refresh stats)
      socket.on("leave_cancelled_targeted", (data) => {
        if (data.roles.includes(user?.role)) {
          queryClient.invalidateQueries({ queryKey: ["adminStats"] });
        }
      });

      return () => {
        socket.off("new_message");
        socket.off("new_leave_request_targeted");
        socket.off(`leave_status_update_${user?.id}`);
        socket.off("peer_leave_approved");
        socket.off("leave_cancelled_targeted");
      };
    }
  }, [socket, queryClient]);

  // Compute date range from selected window
  const { startDate, endDate } = useMemo(() => {
    const today = new Date();
    const start = format(today, "yyyy-MM-dd");
    const windowDays =
      DATE_WINDOWS.find((w) => w.key === selectedWindow)?.days ?? 7;
    const end = format(addDays(today, windowDays), "yyyy-MM-dd");
    return { startDate: start, endDate: end };
  }, [selectedWindow]);

  const handleDownloadReport = async () => {
    try {
      setIsDownloading(true);
      const data = await downloadAdminReport();

      if (!data) {
        throw new Error("No data received from server");
      }

      const filename = `report_${format(new Date(), "yyyy-MM-dd")}.csv`;
      const fileUri = (FileSystem.documentDirectory || "") + filename;

      await FileSystem.writeAsStringAsync(fileUri, data, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        AlertService.toast({
          message: "Sharing is not available on this device",
          type: "error",
        });
      }
    } catch (error: any) {
      console.error("Download Error:", error);
      AlertService.error(error, "Download failed");
    } finally {
      setIsDownloading(false);
    }
  };

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

  // ── Peers leaves query ──────────────────────────────────────────────────
  const {
    data: peersData,
    isLoading: peersLoading,
    refetch: peersRefetch,
    isRefetching: peersIsRefetching,
  } = useQuery({
    queryKey: ["peersLeaves", startDate, endDate],
    queryFn: () => getPeersLeaves(startDate, endDate),
  });

  // ── My summary (employee only) ──────────────────────────────────────────
  const {
    data: summaryData,
    isLoading: summaryLoading,
    refetch: summaryRefetch,
    isRefetching: summaryIsRefetching,
  } = useQuery({
    queryKey: ["summary"],
    queryFn: () => getMySummary(),
    enabled: user?.role === "EMPLOYEE",
  });

  // ── Admin stats ─────────────────────────────────────────────────────────
  const {
    data: adminStatsData,
    isLoading: adminStatsLoading,
    refetch: adminStatsRefetch,
    isRefetching: adminStatsIsRefetching,
  } = useQuery({
    queryKey: ["adminStats"],
    queryFn: () => getAdminStats(),
    enabled: user?.role !== "EMPLOYEE",
  });

  const summary = summaryData?.data?.summary;
  const adminStats = adminStatsData?.data;
  const peersLeaves = peersData?.data ?? [];

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
        return <CheckCircle2 size={14} color={colors.status.approved} />;
      case "rejected":
        return <XCircle size={14} color={colors.status.rejected} />;
      case "cancelled":
        return <XCircle size={14} color={colors.neutral.base} />;
      default:
        return <Clock size={14} color={colors.status.pending} />;
    }
  };

  const windowTitle = () => {
    const opt = DATE_WINDOWS.find((w) => w.key === selectedWindow);
    if (!opt) return "Upcoming";
    if (opt.days === 0) return "Today";
    return `Next ${opt.label}`;
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
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate("Chat")}
          >
            <MessageCircle size={24} color={colors.primary} />
            {unreadCount > 0 && (
              <View style={styles.chatBadge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {user?.role !== "EMPLOYEE" && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleDownloadReport}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Download size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
            <LogOut size={24} color={colors.primary} />
            <Text style={styles.headerButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={
              peersIsRefetching ||
              (user?.role === "EMPLOYEE"
                ? summaryIsRefetching
                : adminStatsIsRefetching)
            }
            onRefresh={() => {
              peersRefetch();
              if (user?.role === "EMPLOYEE") summaryRefetch();
              else adminStatsRefetch();
            }}
          />
        }
      >
        {/* ── Stats Grid ── */}
        <View style={styles.statsGrid}>
          {user?.role === "EMPLOYEE" ? (
            <>
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
                label="Taken"
                value={summary?.totalLeavesTaken ?? "-"}
                icon={CheckCircle2}
                color={colors.status.approved}
              />
            </>
          ) : (
            <>
              <StatCard
                label="Total Staff"
                value={adminStats?.totalEmployees ?? "-"}
                icon={Users}
                color={colors.secondary}
                onPress={() => navigation.navigate("EmployeeList")}
              />
              <StatCard
                label="Leave Today"
                value={adminStats?.leavesToday?.length ?? "-"}
                icon={Briefcase}
                color={colors.status.rejected}
                onPress={() =>
                  navigation.navigate("EmployeeList", {
                    filterTitle: "On Leave Today",
                    employees: adminStats?.leavesToday,
                    readOnly: true,
                  })
                }
              />
              <StatCard
                label="WFH Today"
                value={adminStats?.wfhToday?.length ?? "-"}
                icon={Monitor}
                color={colors.status.approved}
                onPress={() =>
                  navigation.navigate("EmployeeList", {
                    filterTitle: "On WFH Today",
                    employees: adminStats?.wfhToday,
                    readOnly: true,
                  })
                }
              />
              <StatCard
                label="WDH Today"
                value={adminStats?.wdhToday?.length ?? "-"}
                icon={Briefcase}
                color={colors.secondary}
                onPress={() =>
                  navigation.navigate("EmployeeList", {
                    filterTitle: "On WDH Today",
                    employees: adminStats?.wdhToday,
                    readOnly: true,
                  })
                }
              />
              <StatCard
                label="Pending"
                value={adminStats?.statsMonth?.pending ?? "-"}
                icon={Clock}
                color={colors.status.pending}
                onPress={() =>
                  navigation.navigate("AdminDashboard", { filter: "pending" })
                }
              />
              <StatCard
                label="Approved"
                value={adminStats?.statsMonth?.approved ?? "-"}
                icon={CheckCircle2}
                color={colors.status.approved}
                onPress={() =>
                  navigation.navigate("AdminDashboard", { filter: "approved" })
                }
              />
              <StatCard
                label="Rejected"
                value={adminStats?.statsMonth?.rejected ?? "-"}
                icon={XCircle}
                color={colors.status.rejected}
                onPress={() =>
                  navigation.navigate("AdminDashboard", { filter: "rejected" })
                }
              />
            </>
          )}
        </View>

        {/* ── Admin Panel shortcuts ── */}
        {user?.role !== "EMPLOYEE" && (
          <View style={styles.adminSection}>
            <Text style={styles.sectionTitle}>Admin Panel</Text>
            <View style={styles.adminGrid}>
              <View style={[styles.adminCard, styles.badgeContainer]}>
                <TouchableOpacity
                  style={styles.adminCardInner}
                  onPress={() => navigation.navigate("AdminDashboard")}
                >
                  <Shield size={24} color={colors.primary} />
                  <Text style={styles.adminCardText}>Manage Leaves/WFH</Text>
                </TouchableOpacity>
                {(adminStats?.statsMonth?.pending ?? 0) > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {adminStats!.statsMonth!.pending}
                    </Text>
                  </View>
                )}
              </View>
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

        {/* ── Peers Upcoming Leaves ── */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Peers' Upcoming Leaves</Text>
            <Text style={styles.sectionSubtitle}>{windowTitle()}</Text>
          </View>
        </View>

        {/* Date window selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pillRow}
          contentContainerStyle={styles.pillContent}
        >
          {DATE_WINDOWS.map((opt) => {
            const active = selectedWindow === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setSelectedWindow(opt.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.pillText, active && styles.pillTextActive]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Peers list */}
        {peersLoading ? (
          <ActivityIndicator
            style={{ marginTop: 32 }}
            color={colors.secondary}
          />
        ) : peersLeaves.length > 0 ? (
          peersLeaves.map((leave: any) => {
            const firstDate = leave.timeline?.[0]?.dateIso;
            const lastDate =
              leave.timeline?.[leave.timeline.length - 1]?.dateIso;
            const dateRange =
              leave.timeline.length > 1
                ? `${format(parseISO(firstDate), "MMM dd")} – ${format(
                    parseISO(lastDate),
                    "MMM dd",
                  )}`
                : format(parseISO(firstDate), "MMM dd, yyyy");

            const statusColor = getStatusColor(leave.status);

            return (
              <TouchableOpacity
                key={leave._id}
                style={styles.peerCard}
                onPress={() =>
                  navigation.navigate("LeaveDetails", { id: leave._id })
                }
                activeOpacity={0.7}
              >
                {/* Avatar + name */}
                <View style={styles.peerLeft}>
                  <View style={styles.peerAvatar}>
                    <UserIcon size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.peerName} numberOfLines={1}>
                      {leave.employee?.displayName ?? "Unknown"}
                    </Text>
                    <Text style={styles.peerEmail} numberOfLines={1}>
                      {leave.employee?.email ?? "Unknown"}
                    </Text>
                    <Text style={styles.peerDept} numberOfLines={2}>
                      {leave.timeline?.[0]?.comment ||
                        leave.timeline?.[0]?.reasonCode ||
                        "No reason specified"}
                    </Text>
                  </View>
                </View>

                {/* Date + meta */}
                <View style={styles.peerRight}>
                  <Text style={styles.peerDate}>{dateRange}</Text>
                  <View style={styles.peerMeta}>
                    <Text style={styles.peerType}>
                      {leave.leaveDetails?.category ??
                        leave.requestType?.toUpperCase()}{" "}
                      · {leave.leaveDetails?.totalDaysRequested}d
                    </Text>
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: `${statusColor}18` },
                      ]}
                    >
                      {getStatusIcon(leave.status)}
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {leave.status.charAt(0).toUpperCase() +
                          leave.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No upcoming leaves from peers in this window 🎉
            </Text>
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("ApplyLeave")}
      >
        <Plus color="#fff" size={24} />
        <Text style={styles.fabText}>New Request</Text>
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
  headerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  headerButton: {
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
  headerButtonText: {
    fontSize: 8,
    fontWeight: "500",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 110,
  },
  // ── Stats ──
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
    margin: 2,
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
  // ── Admin ──
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
  badgeContainer: {
    position: "relative",
    flex: 1,
  },
  adminCardInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.status.rejected,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    zIndex: 10,
    borderWidth: 2,
    borderColor: colors.neutral.light,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  chatBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.status.rejected,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    zIndex: 10,
    borderWidth: 2,
    borderColor: "#fff",
  },
  // ── Section header ──
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.main,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 2,
  },
  // ── Date window pills ──
  pillRow: {
    marginBottom: 16,
  },
  pillContent: {
    gap: 8,
    paddingRight: 4,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: colors.neutral.base,
  },
  pillActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.muted,
  },
  pillTextActive: {
    color: "#fff",
  },
  // ── Peer card ──
  peerCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  peerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  peerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: `${colors.secondary}18`,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  peerName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text.main,
  },
  peerEmail: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 1,
  },
  peerDept: {
    fontSize: 11,
    color: colors.text.muted,
    marginTop: 1,
  },
  peerRight: {
    alignItems: "flex-end",
    flexShrink: 0,
  },
  peerDate: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 4,
  },
  peerMeta: {
    alignItems: "flex-end",
    gap: 4,
  },
  peerType: {
    fontSize: 11,
    color: colors.text.muted,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  // ── Empty state ──
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
    textAlign: "center",
  },
  // ── FAB ──
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
});
