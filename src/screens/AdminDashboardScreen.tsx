import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllLeavesForAdmin, updateLeaveStatus } from "../api/leaveApi";
import { colors } from "../theme/colors";
import { AlertService } from "../components/AlertService";
import { Clock, ChevronLeft } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { CollapsibleLeaveItem } from "../components/CollapsibleLeaveItem";

export default function AdminDashboardScreen({ navigation }: any) {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("pending");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["allLeaves", filter],
    queryFn: () => getAllLeavesForAdmin({ status: filter }),
  });

  const leaves = data?.data || [];

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateLeaveStatus(id, {
        status,
        approverId: currentUser?.id || "",
        approverRole: currentUser?.role || "ADMIN",
        message: `Processed by ${currentUser?.displayName}`,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allLeaves"] });
      AlertService.toast({
        message: "Status updated successfully.",
        type: "success",
      });
    },
    onError: (error: any) => {
      AlertService.error(error, "Update failed.");
    },
  });

  const handleStatusUpdate = (id: string, status: string) => {
    AlertService.confirm(
      "Confirm Action",
      `Are you sure you want to ${status} this leave?`,
      () => mutation.mutate({ id, status }),
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <CollapsibleLeaveItem
      item={item}
      onApprove={(id) => handleStatusUpdate(id, "approved")}
      onReject={(id) => handleStatusUpdate(id, "rejected")}
    />
  );

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ChevronLeft size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave Management</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.filterRow}>
        {["pending", "approved", "rejected"].map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterBtn, filter === s && styles.filterBtnActive]}
            onPress={() => setFilter(s)}
          >
            <Text
              style={[
                styles.filterText,
                filter === s && styles.filterTextActive,
              ]}
            >
              {s.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
      ) : (
        <FlatList
          data={leaves}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Clock size={48} color={colors.neutral.base} />
              <Text style={styles.emptyText}>No {filter} requests found</Text>
            </View>
          }
        />
      )}
    </View>
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
    paddingTop: 12,
    paddingBottom: 12,
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
  filterRow: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    gap: 8,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.neutral.light,
    alignItems: "center",
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text.muted,
  },
  filterTextActive: {
    color: "#fff",
  },
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral.light,
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text.main,
  },
  userDept: {
    fontSize: 12,
    color: colors.text.muted,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
  },
  cardBody: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.light,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 8,
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.text.muted,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.main,
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  approveButton: {
    backgroundColor: colors.status.approved,
  },
  rejectButton: {
    backgroundColor: colors.status.rejected,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    marginTop: 12,
    color: colors.text.muted,
    fontSize: 16,
  },
});
