import React from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getMyLeaves } from "../api/leaveApi";
import { colors } from "../theme/colors";
import { format, parseISO } from "date-fns";
import {
  Calendar,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  LogOut,
} from "lucide-react-native";
import { useAuth } from "../context/AuthContext";

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "approved":
      return colors.status.approved;
    case "rejected":
      return colors.status.rejected;
    case "pending":
      return colors.status.pending;
    default:
      return colors.neutral.base;
  }
};

const getStatusIcon = (status: string) => {
  const size = 18;
  switch (status.toLowerCase()) {
    case "approved":
      return <CheckCircle2 size={size} color={colors.status.approved} />;
    case "rejected":
      return <XCircle size={size} color={colors.status.rejected} />;
    case "pending":
      return <Clock size={size} color={colors.status.pending} />;
    default:
      return <Clock size={size} color={colors.neutral.base} />;
  }
};

export default function LeaveHistoryScreen({ navigation }: any) {
  const { signOut } = useAuth();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["myLeaves"],
    queryFn: getMyLeaves,
  });

  const leaveApplications = data?.data || [];

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        /* navigate to detail if needed */
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.statusContainer}>
          {getStatusIcon(item.status)}
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
        <Text style={styles.dateText}>
          Applied on {format(parseISO(item.createdAt), "MMM dd, yyyy")}
        </Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.detailsContainer}>
          <Text style={styles.categoryTitle}>{item.leaveDetails.category}</Text>
          <Text style={styles.daysText}>
            {item.leaveDetails.totalDaysRequested} Day(s)
            <Text style={styles.daysSubtext}>
              • {item.leaveDetails.paidDaysCount} Paid,{" "}
              {item.leaveDetails.unpaidDaysCount} Unpaid
            </Text>
          </Text>
        </View>
        <ChevronRight size={20} color={colors.neutral.base} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Leaves</Text>
          <Text style={styles.headerSubtitle}>
            View your leave status and history
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <LogOut size={20} color={colors.neutral.base} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
      ) : (
        <FlatList
          data={leaveApplications}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.secondary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Calendar size={48} color={colors.neutral.base} strokeWidth={1} />
              <Text style={styles.emptyText}>No leave applications found</Text>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => navigation.navigate("ApplyLeave")}
              >
                <Text style={styles.applyButtonText}>Apply for Leave</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {!isLoading && leaveApplications.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("ApplyLeave")}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.neutral.base,
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "700",
  },
  dateText: {
    fontSize: 12,
    color: colors.neutral.base,
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailsContainer: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 4,
  },
  daysText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
  daysSubtext: {
    color: colors.neutral.base,
    fontWeight: "400",
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.neutral.base,
    marginTop: 16,
    marginBottom: 24,
  },
  applyButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "300",
    lineHeight: 32,
  },
});
